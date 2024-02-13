---
title: "Enabling Hibernate on my Linux laptop (Pop OS)"
date: "2024-02-13"
draft: false
tags: [Linux, operating systems]
---

# Enabling Hibernate on my Linux laptop (Pop OS)

I've been using Linux on my laptop for more than a decade now. It is well-known that depending on the distro and the laptop you use, _"deep sleep"_ and/or hibernate may not be well-supported. This means that even if I closed the lid of my laptop, its battery will end up draining until it runs out. This was quite frustrating, because it meant that if I was working on my laptop and close the lid without remembering to shut down the laptop, I would come back to a laptop without battery. I recently bought a new [Framework](https://frame.work/), and while I was setting it up I decided that enough is enough, and that it was long overdo since I properly configured hibernate or deep sleep so that when I closed the lid and came back to my laptop I could come back to work without worrying about its battery.

## Prerequisites
Full context, I am currently running [Pop OS](https://pop.system76.com/) (a Debian-based distro created by System76) on all my devices. These steps should definitely work on every Debian-based distro, and presumably also apply to other distros, but let me know if this is the case.

First thing's first. Before doing anything we should double-check that hibernate is actually supported by our kernel:
```shell
cat /sys/power/state
```
In order to avoid any changes to my disk partitions, I will set up a swapfile to support hibernation, so the above command should list `disk` for our kernel to support the hibernation setup that I will walk you through in this post.

## Create a swap file
If you don't already have a swap partition, or it is not big enough to fit the size requirements to hibernate your system, you'll need to create a new swap file. As a rule of thumb, your swapfile should have around twice the size of your RAM to ensure that there' s enough space to persist the data for hibernation (but you could also check out this [support page](https://help.ubuntu.com/community/SwapFaq) for a more accurate explanation). In my case, I have `64GiB` of RAM in my laptop, so I configured a `128G` swap file through  as follows:

- First, I created the swap file, assigned the right permissions, and formatted as a swap.
```shell
sudo fallocate -l 128G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
```
- And then activated the swap
```shell
sudo swapon /swapfile
echo '/swapfile none swap defaults 0 0' | sudo tee -a /etc/fstab
```
- Finally, we can check if the above commands worked by listing the system's swaps. Your new `/swapfile` swap should be listed there.
```shell
cat /proc/swaps
```

## Configure hibernation
With our swap ready, we are now in a position to configure hibernation in our system:
- We first need to get the `UUID` of our new swap file:
```shell
findmnt -no UUID -T /swapfile
```
You should receive an output that is something like `9e29141f-822f-4758-bb9a-87f3eaa6e1a5`.
- We then need to get the swap offset.
```shell
sudo filefrag -v /swapfile | awk '{ if($1=="0:"){print $4} }'
```
The output should be a number such as `9999999..`.
- We'll configure the kernel swap using the `<UUID>` and `<offset>` values from above (replace these in the command below with your own values).
```shell
sudo kernelstub -a "resume=UUID=<UUID>"
sudo kernelstub -a "resume_offset=<offeset>"

# Example
# sudo kernelstub -a "resume=UUID=9e29141f-822f-4758-bb9a-87f3eaa6e1a5"
# sudo kernelstub -a "resume_offset=9999999"
```
And adding the following line to `/etc/initramfs-tools/conf.d/resume`. You should create the file if the file doesn't already exist.
```
resume=UUID=<UUID> resume_offset=<offset>
```
- Finally, we update our kernel configuration through:
```shell
sudo update-initramfs -u
```

In order to test if this worked you can restart your system, and then run see what happens:
```shell
sudo systemctl hibernate

```

## Configure hibernation when closing the lid
Cool! So hibernate works, but how can I configure the system to hibernate after some time when closing the lid so my battery is not drained? Actually this was simpler than expected. We just need to:
- Edit  `/etc/systemd/logind.conf` to enable `suspend-then-hibernate` (as you may see in the config below, you can also optionally set this configuration when the lid is closed and there is external power, or when we suspend the device after being idle for some time):
```diff
[Login]
. . .
#HandlePowerKey=poweroff
#HandleSuspendKey=suspend
#HandleHibernateKey=hibernate
#HandleLidSwitch=suspend
+ HandleLidSwitch=suspend-then-hibernate
HandleLidSwitchExternalPower=suspend-then-hibernate
#HandleLidSwitchDocked=ignore
#HandleRebootKey=reboot
#PowerKeyIgnoreInhibited=no
#SuspendKeyIgnoreInhibited=no
#HibernateKeyIgnoreInhibited=no
#LidSwitchIgnoreInhibited=yes
#RebootKeyIgnoreInhibited=no
#HoldoffTimeoutSec=30s
#IdleAction=ignore
IdleAction=suspend-then-hibernate
#IdleActionSec=30min
IdleActionSec=30min
. . .
```
- Finally, we can configure the delay in seconds for hibernate to kick-in when the system is suspended by editing `etc/systemd/sleep.conf` as follows (in my case 60 mins):
```diff
[Sleep]
#AllowSuspend=yes
#AllowHibernation=yes
#AllowSuspendThenHibernate=yes
#AllowHybridSleep=yes
#SuspendMode=
#SuspendState=mem standby freeze
#HibernateMode=platform shutdown
#HibernateState=disk
#HybridSleepMode=suspend platform shutdown
#HybridSleepState=disk
#HibernateDelaySec=180min
+ HibernateDelaySec=60min
```

And with this (hopefully), you won't run out of battery when you close your lid and forget to shutdown your laptop for the day.


## References
- https://abskmj.github.io/notes/posts/pop-os/enable-hibernate/
- https://askubuntu.com/questions/12383/how-to-go-automatically-from-suspend-into-hibernate
- https://www.reddit.com/r/pop_os/comments/uazr02/wits_end_sleephibernate_on_lid_close/
- https://support.system76.com/articles/enable-hibernation/
