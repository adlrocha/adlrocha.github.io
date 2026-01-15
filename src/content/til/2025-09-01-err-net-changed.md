---
title: "Fix ERR_NETWORK_CHANGED"
date: "2025-01-23"
draft: false
tags: ["til", "networking", "docker"]
---

This was a pretty annoying issue that I had been facing for months and that it was harming my daily
productivity to a point that I was considering completely formatting my computer and starting from
scratch. The issue was the following:

- Every time that I was using an Electron application or I opened a website in my browser that used
  websocket or a persistent communication to a server led to intermitently getting a
  `ERR_NETWORK_CHANGED` error. This triggered a restart in the application or website connection.
  For certain applications this was fine, but whenever I was interacting with an LLM or leveraging a
  coding agent with a persistent connection, getting an `ERR_NETWORK_CHANGED` error was a major
  setback as it required restarting all the work that it was doing.
- I tried everything to debug the problem:
  - I first checked if this could be related with the power saving mode for the Wifi card of my
    Framework laptop, but it was still happening when connected through Ethernet.
  - I disabled my VPNs and reviewed all my firewalls and network policies... still nothing!
- I decided then to directly run `sudo journalctl -f -u NetworkManager` to see if I could catch one
  of these events and figure out what was causing the error. And voilá, I found the culprit! The
  error was being triggered by the network manager triggering an event every time a new virtual
  interface was being created. This event was being propagated and picked up by browsers and
  electron applications that were picking up this event as a network change that required a
  reconnection.
- I had to know figure out who and why was this virtual interface was being created every minute. I
  inspected my `docker events` and the reason was obvious immediately. I was running a few
  containers (mainly Redis) that was running a healthchecks every minute. In order to perform this
  healthcheck, Docker was creating an ephimeral virtual interface that was created and immediately
  destroyed. This is the network event involving my network interfaces that was being picked up by
  the network manager and propagated up.
- The issue was simple, I disabled all healthcheck on my containers and it solved the problem. It
  may seem obvious now, but it was a pretty hard one to debug.

I also tried to blacklist virtual interfaces in the network manager so the changes triggered by
healthcheck virtual interfaces are not propagated up, but this ended up not working reliably. It may
be worth exploring this approach further as it seems cleaner (and more nuclear) but the time I
time-boxed for this debugging was up and I had to move to something else. I guess this is good
enough for now, I'll keep you posted if this issue (or something related) ends up surfacing in the
world again, or if I end up finding the time to debug and find a better fix for it.
