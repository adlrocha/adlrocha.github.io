---
title: "Never take Marshaling for granted"
date: 2021-03-21
draft: false
tags: [go, programming]
---

_Marshaling interfaces in Go._

![alt_text](https://images.unsplash.com/photo-1525091752287-44ce44eab2fa?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1049&q=80 "image_tooltip")

We sometimes take marshaling for granted, but** there is more than one occasion in which you have no choice but to write your own custom marshaller. **Either because your compiler/marshal library is not able to infer how to automatically marshal your objects, because your marshaler is not generating the right output** (we saw last week[ how a JSON document can be parsed with different values across microservices, leading to a variety of potential security risk](https://labs.bishopfox.com/tech-blog/an-exploration-of-json-interoperability-vulnerabilities)), etc. The fact is that for one reason or the other, one day you may end up having to tinker with your marshaller, and you better be prepared if you don’t want to drain your time trying to make things work. **This is exactly what happened to me this week.** Let me walk you through the marvelous world of interface marshaling in Golang.


## Vanilla Marshal

I guess everyone is aware about what marshaling means (at least in the field of computer science), but just in case, marshaling _“is the process of transforming the memory representation of an object into a data format suitable for storage or transmission”. _You can marshal an object to several different formats: from formats such as JSON, or XML, to binary representations like CBOR. **Throughout this publication, we are going to focus on JSON marshaling, but all of the concepts presented are applicable when targeting other types of representation.**

Until you face complex use cases, marshaling seems like a straightforward thing in Golang. You take the `encoding/json` library (or the convenient want for your serialization format), annotate your objects, and let the library do the rest. Let’s look at a quick example:

```go

package main

import (
    "fmt"
    "encoding/json"
)

type Pair struct {
    Key string `json:"key"`
    Value int  `json:"value"`
}

type Pairs []Pair

func main() {
    // Marshaling a struct
    fmt.Println("== Marshalling struct ==")
    p := Pair{Key: "someKey", Value: 1}
    // Marshal
    byteData, err := json.Marshal(p)
    checkErr(err)
    fmt.Println("Marshalled:", string(byteData))

    // Unmarshal into Pair struct
    pout := Pair{}
    err = json.Unmarshal(byteData, &pout)
    checkErr(err)
    fmt.Println("Unmarshalled:", pout)

    // Marshaling a list of Pairs
    fmt.Println("== Marshalling pairs ==")
    p1 := Pair{Key: "someKey", Value: 1}
    p2 := Pair{Key: "otherKey", Value: 2}
    pl := Pairs{p1, p2}

    byteData, err = json.Marshal(pl)
    checkErr(err)
    fmt.Println("Marshalled:", string(byteData))

    // Unmarshalling into the right type
    plout := Pairs{}
    err = json.Unmarshal(byteData, &plout)
    checkErr(err)
    fmt.Println("Unmarshalled:", plout)

}

func checkErr(err error){
    if err != nil{
   	 panic(err)
    }
}
```
Playground link: [https://play.golang.org/p/ZoKXcUuFa1d](https://play.golang.org/p/ZoKXcUuFa1d)

We created a `Pair`and `Pairs` structs, annotated the Pair struct, and marshalled them without involving any kind of black magic. **Everything works “out-of-the-box”.** Marshaling doesn’t seem that hard right?


## Introducing interfaces to the mix

But what happens when we start introducing interfaces to the mix? Things start getting a bit messier. Let Pair have now a key and a value of type Node. Node is an interface type, so it means that key and value can be of several different types. To see what happens when marshaling interface types, **we create two new String and Int types which implement the Node interface.** Let’s see what happens now when we try to marshal something using the straightforward and naïve approach from above.

```go
package main
import (
    "fmt"
    "encoding/json"
)

// Object Structs
type Node interface{
    Print()
}

type Pair struct {
    Key Node `json:"key"`
    Value Node  `json:"value"`
}

type String struct {
    Value string
}

type Int struct {
    Value int
}

func (s String) Print(){
    fmt.Println(s.Value)
}

func (i Int) Print(){
    fmt.Println(i.Value)
}

type Pairs []Pair

func main() {

    // Marshaling a struct
    fmt.Println("== Marshalling struct ==")
    p := Pair{Key: String{"someKey"}, Value: Int{1}}
    // Marshal
    byteData, err := json.Marshal(p)
    checkErr(err)
    fmt.Println("Marshalled:", string(byteData))

    // Unmarshal into Pair struct
    pout := Pair{}
    err = json.Unmarshal(byteData, &pout)
    checkErr(err)
    fmt.Println("Unmarshalled:", pout)

}

func checkErr(err error){
    if err != nil{
   	    panic(err)
    }
}
```

Playground link: [https://play.golang.org/p/tbG9jrVA_u7](https://play.golang.org/p/tbG9jrVA_u7) 

Oh, oh! Problems! We are doing exactly the same as before but now the types inside the struct are interfaces. Unmarshaling doesn’t go as smooth as expected, and **now we are getting the following error:**

```
panic: json: cannot unmarshal object into Go struct field Pair.key of type main.Node
```

Why is this happening? The package `encoding/json` uses `reflect` under the hood to infer the type in which it needs to unmarshal the serialization. **But interfaces are dynamic types, and our JSON marshaler is not able to infer by itself the right type to use for the unmarshaling. **What can we do? We will have to give some hints to our unmarshaller.


## Building a custom unmarshaller

We can give our unmarshaller hints in several ways. **The first thing we are going to try is to write a custom unmarshaller for Pair**, so we can manually process the serialization and assign the right Node type. The `encoding/json` package lets you overwrite its interface to implement your custom unmarshaller, and that is exactly what we are going to do.  For this task, we are going to use the [RawMessage](https://golang.org/pkg/encoding/json/#RawMessage) capabilities of the`encoding/json` package. _“RawMessage is a raw encoded JSON value. It implements Marshaler and Unmarshaler and can be used to delay JSON decoding or precompute a JSON encoding”. _This is how our custom unmarshaller for Pair looks like:

```go
// Custom unmarshal for pairs
func (p *Pair) UnmarshalJSON(b []byte) error {
    // Use RawMessage to get the key and value of the struct
    var objMap map[string]*json.RawMessage
    err := json.Unmarshal(b, &objMap)

    if err != nil {
        return err
    }

    // Let the compiler know they are of type String
    var k, v String
    // Unmarshal the key and value
    err = json.Unmarshal(*objMap["key"], &k)
    if err != nil {
   	    return err
    }
    err = json.Unmarshal(*objMap["value"], &v)
    if err != nil {
        return err
    }

    p.Key = k
    p.Value = v
    return nil

}
```

We use RawMessage to get the raw bytes of the Key and Value fields of the struct, and we perform the independent unmarshalling of both letting our unmarshaller know that in this case both, key and value, are of type String. With this simple trick we managed to unmarshal Pairs whose key and value are of type String, but what happens if we create an object where  Key or Value are of type Int? Things start breaking again, **because our custom unmarshaller only understands String Nodes and not Int Nodes.** But how can we tell our unmarshaller that the Key or the Value are of a certain type? We need to add this knowledge to our serialized format.

## Building a custom unmarshaller

**The same way we overwrite the unmarshaller for Pairs we are going to write a custom marshaller for our Int and String nodes so we can include information about the type in the serialized format** that our unmarshaller can use to its convenience. This sounds simple, right? We create, for instance, a MarshalType with an enum of the different types implementing the Node interface, and wrap the current default marshaller for Int and String into a new marshaller that also includes the type. Easy peasy. Wait, don’t be so quick to claim victory. If we naïvely write our marshaller like this:

```go

func (i Int) MarshalJSON() (bdata []byte, e error) {
    c := struct {
        Type  MarshalType `json:"type"`
        Value tmp     	`json:"value"`
    }{Type: IntType, Value: ts}
    
    return json.Marshal(&c)
}

```

**We end up reaching an infinite loop.** Every time the marshaller encounters (in the above case) an Int type, it calls this function, which already calls json.Marshal for Int (`return json.Marshal(&c)`). The infinite loop is served. How can we then wrap the standard recursion in our overwritten marshaller? Using a temporal type to avoid recursion as follows:

```go

func (i Int) MarshalJSON() (bdata []byte, e error) {
    // Temporal type to avoid recursion
    type tmp Int
    ts := tmp(i)

    c := struct {
        Type  MarshalType `json:"type"`
        Value tmp     	`json:"value"`
    }{Type: IntType, Value: ts}
    
    return json.Marshal(&c)
}

// Custom Marshal Functions

func (s String) MarshalJSON() (bdata []byte, e error) {
    // Temporal type to avoid recursion
    type tmp String
    ts := tmp(i)

    c := struct {
        Type  MarshalType `json:"type"`
        Value tmp     	`json:"value"`
    }{Type: StringType, Value: ts}
    
    return json.Marshal(&c)
}

```

The two first lines of the function add a temporal type so we avoid recursion when calling the `json.Marshal` inside our custom marshaller.


## Putting it all together

We are almost done! Now we just have to **modify our Pair custom unmarshaller to identify the type of the Node everytime it encounters one so it knows the right way to unmarshal it. **We create the following auxiliary function for this:

```go
// Unmarshaling Pair types
func UnmarshalType(tp MarshalType, b []byte) (Node, error) {
        switch tp {
        case StringType:
                var n String
                err := json.Unmarshal(b, &n)
                if err != nil {
                        return nil, err
                }
                return n, nil
        case IntType:
                var n Int
                err := json.Unmarshal(b, &n)
                if err != nil {
                        return nil, err
                }
                return n, nil
        }
        return nil, fmt.Errorf("Wrong type")
}

```

This simple function gives the unmarshaller the hint it needs to know how to unmarshal the right type (avoiding the errors we were facing above). Our custom Pair unmarshaller doesn’t change much, we just need to replace the json.Unmarshal by this UnmarshalType, things would run smoothly:

```go
// Custom unmarshal for pairs
func (p *Pair) UnmarshalJSON(b []byte) error {
    var objMap map[string]map[string]*json.RawMessage
    err := json.Unmarshal(b, &objMap)
    if err != nil {
   	    return err
    }

    var kType, vType int
    json.Unmarshal(*objMap["key"]["type"], &kType)
    json.Unmarshal(*objMap["value"]["type"], &vType)

    p.Key, err = UnmarshalType(MarshalType(kType), *objMap["key"]["value"])
    if err != nil {
   	    eturn err
    }
    p.Value, err = UnmarshalType(MarshalType(vType), *objMap["value"]["value"])
    if err != nil {
   	    return err
    }
    return nil
}

```

And voilá, we managed to build our custom marshaller and unmarshaller to serialize dynamic types. Cool right? Here is the full working code:

```go
/* Copyright (c) 2021, Alfonso de la Rocha

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

package main

import (
	"fmt"
	"encoding/json"
)

// Object Structs
type Node interface{
	Print()
}

type Pair struct {
	Key Node `json:"key"`
	Value Node  `json:"value"`
}

type Pairs []Pair

type String struct {
	Value string
}

type Int struct {
	Value int
}

func (s String) Print(){
	fmt.Println(s.Value)
}

// MarshalType to strongly type json
type MarshalType int

const (
	StringType = iota
	IntType
)
func (i Int) Print(){
	fmt.Println(i.Value)
}

// Custom Marshal Functions
func (s String) MarshalJSON() (bdata []byte, e error) {
	// Temporal type to avoid recursion
	type tmp String
	ts := tmp(s)

	c := struct {
		Type  MarshalType `json:"type"`
		Value tmp         `json:"value"`
	}{Type: StringType, Value: ts}
	return json.Marshal(&c)
}

func (i Int) MarshalJSON() (bdata []byte, e error) {
	// Temporal type to avoid recursion
	type tmp Int
	ts := tmp(i)

	c := struct {
		Type  MarshalType `json:"type"`
		Value tmp         `json:"value"`
	}{Type: IntType, Value: ts}
	return json.Marshal(&c)
}

// Unmarshaling Pair types
func UnmarshalType(tp MarshalType, b []byte) (Node, error) {
	switch tp {
	case StringType:
		var n String
		err := json.Unmarshal(b, &n)
		if err != nil {
			return nil, err
		}
		return n, nil
	case IntType:
		var n Int
		err := json.Unmarshal(b, &n)
		if err != nil {
			return nil, err
		}
		return n, nil
	}
	return nil, fmt.Errorf("Wrong type")
}

// Custom unmarshal for pairs
func (p *Pair) UnmarshalJSON(b []byte) error {

	var objMap map[string]map[string]*json.RawMessage
	err := json.Unmarshal(b, &objMap)
	if err != nil {
		return err
	}
	var kType, vType int
	json.Unmarshal(*objMap["key"]["type"], &kType)
	json.Unmarshal(*objMap["value"]["type"], &vType)
	p.Key, err = UnmarshalType(MarshalType(kType), *objMap["key"]["value"])
	if err != nil {
		return err
	}
	p.Value, err = UnmarshalType(MarshalType(vType), *objMap["value"]["value"])
	if err != nil {
		return err
	}
	return nil
}


func main() {
	// Marshaling a struct
	fmt.Println("== Marshalling struct ==")
	p := Pair{Key: String{"someKey"}, Value: Int{1}}
	// Marshal
	byteData, err := json.Marshal(p)
	checkErr(err)
	fmt.Println("Marshalled:", string(byteData))
	// Unmarshal into Pair struct
	pout := Pair{}
	err = json.Unmarshal(byteData, &pout)
	fmt.Println("Unmarshalled:", pout)
	
    	// Marshaling a list of Pairs
	fmt.Println("== Marshalling pairs ==")
    	p1 := Pair{Key: String{"someKey"}, Value: Int{1}}
       p2 := Pair{Key: String{"otherKey"}, Value: Int{2}}
       pl := Pairs{p1, p2}
       byteData, err = json.Marshal(pl)
       checkErr(err)
       fmt.Println("Marshalled:", string(byteData))
       // Unmarshalling into the right type
       plout := Pairs{}
       err = json.Unmarshal(byteData, &plout)
       fmt.Println("Unmarshalled:", plout)
}

func checkErr(err error){
	if err != nil{
		panic(err)
	}
}
```

Playground link: [https://play.golang.org/p/RNPwJkzZ6PU](https://play.golang.org/p/RNPwJkzZ6PU)

Gits hosting the code: [https://gist.github.com/adlrocha/28c522e0bb3e628d65531a84b5c7fb5e](https://gist.github.com/adlrocha/28c522e0bb3e628d65531a84b5c7fb5e)

Did you love this publication? Did you hate that you couldn't read it directly from your email? Send me some love and good feedback [here](https://twitter.com/adlrocha). And if you got to this post using your favorite search engine, do not forget to subscribe for more content [here](https://adlrocha.substack.com).