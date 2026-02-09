---
title: "How I found out that NordVPN Meshnet uses Google DNS"
description: "I am one of those that have a Pi-hole deployed in their home network. Here's how I discovered NordVPN Meshnet routes DNS through Google."
pubDate: 2022-11-07
tags: ["networking", "privacy", "DNS"]
---

I am one of those that have a [Pi-hole](https://pi-hole.net/) deployed in their home network. What's Pi-hole? It is a network-wide ad and tracker blocker, you could say that it is a "smart" DNS server. You basically configure it with a list of domains that it should block, configure all your devices to use it as a DNS server and that's it. Whenever there is a request to a domain, which is known to be used for ads or tracking, Pi-hole blocks it. For example, you will not be able to open ads on Google anymore, because whenever you would click on an ad, you would get an error. You could say that ads on Google can be hidden by ad-blocks - that's true. However imagine that there are services, applications, IoT devices that track you (send data about usage) without your knowledge, that's where Pi-hole really excels.

The default Pi-hole setup is however only for home private network. That means, that whenever I am on a public network or I use mobile data, there is nothing that would block ads or tracking. There are couple of options how you could solve this:

1. Deploying Pi-hole into cloud (Azure, AWS, etc.) and configuring DNS in your phone manually, unfortunately, in iOS you can't change DNS when you are using mobile data.
2. Getting a public IP address from your ISP and configuring DNS manually again. Here we have the same issue as in the first option.
3. Using VPN in your device and blocking the traffic on the VPN server (that's how some app configure the DNS via VPN profile).

## Enter NordVPN Meshnet

This is where I thought NordVPN Meshnet will help me. So, what is NordVPN Meshnet?

> **[Meshnet](https://nordvpn.com/features/meshnet/)** is a new NordVPN feature that allows you to create a secure, private network for many devices located anywhere in the world, access them remotely, and send all your online traffic through another device.

The _send all your online traffic through another device_ part is what really caught my attention. I said to myself that I could route the traffic from my mobile devices (or even laptop) through my home Raspberry PI when I am not connected to my private network. Pi-hole is already deployed on the Raspberry PI, so I thought that the setup will be really easy. What I basically wanted to achieve is routing traffic from my mobile device through my Raspberry PI in my home private network.

Whenever I would be using mobile data or be connected to some public network, I would connect to the Meshnet and the ads and trackers would be blocked. At least I thought so.

## The setup

I started by deploying the NordVPN Linux application to my Raspberry PI. Everything, except some small hiccups, went smoothly. I logged in using the `nordvpn login --token` command, started the meshnet with `nordvpn set meshnet on` and I thought that it should be everything that I need to do on my Raspberry PI. The Raspberry PI was already configured to use Pi-hole for DNS, that means that all DNS queries went through my Pi-hole.

With NordVPN Meshnet in Raspberry PI configured, I continued with the mobile device. Since I already had NordVPN installed, I just had to enable Meshnet and enable traffic routing.

## The investigation

Now, with NordVPN Meshnet running on Raspberry PI, NordVPN Meshnet running on my mobile device, I was ready to give it a try. The first thing that I always try to see if my Pi-hole is working is opening `ads.google.com` and so I did the same on my mobile device. To my surprise the Google Ads page loaded. I started analyzing what had I done wrong.

The first thing that came to my mind was that maybe NordVPN did not connect to my Raspberry PI Meshnet, so while being connected to mobile data I checked whether the public IP address shown in the mobile device is the same as public address shown in devices connected to my private network. It was the same, that means that the request goes thanks to the Meshnet (VPN) through my home network, even if I am connected to mobile data. So this was not the case.

Then I thought that maybe the Raspberry PI is actually not configured correctly to use Pi-hole for DNS. I checked the `/etc/resolv.conf` to see whether it is configured correctly and it indeed was. To be sure, I did my `ads.google.com` test by executing `curl -v ads.google.com` and I received following output, which proved that the Raspberry PI is configured correctly.

```
$ curl -v ads.google.com
*   Trying 0.0.0.0:80...
* Connected to ads.google.com (127.0.0.1) port 80 (#0)
> GET / HTTP/1.1
> Host: ads.google.com
> User-Agent: curl/7.74.0
> Accept: */*
>
* Mark bundle as not supporting multiuse
< HTTP/1.1 404 Not Found
< Content-type: text/html; charset=UTF-8
< Content-Length: 0
< Date: Mon, 07 Nov 2022 23:03:43 GMT
< Server: lighttpd/1.4.59
<
* Connection #0 to host ads.google.com left intact
```

Next thing that I could think of was that NordVPN Meshnet uses a different DNS so I checked their documentation again and I found following command with its documentation

> **nordvpn set dns 1.1.1.1 1.0.0.1** - Set custom DNS (you can set up a single DNS or two like shown in this command)

So I ran the command with my Pi-hole address, restarted everything and gave it another try with `ads.google.com` on the mobile device. The page still loaded successfully. Now I really started getting confused. I tried to look for more documentation related to the `nordvpn set dns` command but unfortunately, I was not able to find any official documentation.

## tcpdump to the rescue

To advance in the analysis I decided to find what DNS the NordVPN Meshnet actually uses, to see whether it is some that could be configured in my network. The NordVPN Meshnet in the Raspberry PI creates a network interface called `nordlynx`.

I thought that I should be able to monitor the DNS queries in this `nordlynx` interface via `tcpdump`. So I started monitoring DNS queries by running `sudo tcpdump -i nordlynx udp port 53` (DNS uses port 53). Then I tried to open `www.davidkaya.com` on my mobile device while being connected to the NordVPN Meshnet and the following appeared in the DNS query monitoring

```
22:56:49.860373 IP ma*****.nord.58744 > dns.google.domain: 43455+ Type65? davidkaya.com. (31)
22:56:49.860565 IP ma*****.nord.49207 > dns.google.domain: 6007+ A? davidkaya.com. (31)
22:56:49.882133 IP dns.google.domain > ma*****.nord.58744: 43455 1/0/0 Type65 (110)
22:56:49.882224 IP dns.google.domain > ma*****.nord.49207: 6007 2/0/0 A 188.114.96.3, A 188.114.97.3 (63)
22:56:50.442988 IP ma*****.nord.64236 > dns.google.domain: 62818+ A? www.davidkaya.com. (35)
22:56:50.443718 IP ma*****.nord.62720 > dns.google.domain: 15422+ Type65? www.davidkaya.com. (35)
22:56:50.467365 IP dns.google.domain > ma*****.nord.64236: 62818 2/0/0 A 188.114.96.3, A 188.114.97.3 (67)
22:56:50.474604 IP dns.google.domain > ma*****.nord.62720: 15422 1/0/0 Type65 (114)
```

You can see that it used `dns.google`. I was quite surprised because Google DNS is definitely not configured anywhere in my network.

## Contacting support

I decided to contact support to see whether I am doing something wrong. The first person that I talked with told me that the NordVPN Meshnet uses their [own private DNS server](https://nordvpn.com/features/private-dns/). I showed him that it is definitely not the case and I got forwarded to some other support person. I explained my problem again, asked how to configure NordVPN Meshnet to use my DNS and asked why does it use Google DNS and after a few minutes I got forwarded again, to someone from the "Connectivity" team. This person finally confirmed, that NordVPN Meshnet indeed uses Google DNS and it is currently not possible to change it. He was not even able to give me an estimate when do they plan to add support for changing the DNS used by NordVPN Meshnet.

## Conclusion

I was quite looking forward to using NordVPN Meshnet for my use case since the following parts from their [blog post](https://nordvpn.com/blog/meshnet-traffic-routing/) really caught my attention

> With a private server, you can control both endpoints of your own VPN connection. **The advantage would be total control over your traffic** and the ability to use a dedicated IP address that belongs to you.

and

> NordVPN's servers have a guaranteed no-logs policy, but **private server owners are free to implement such capabilities on their own private servers**.

Unfortunately, the main reason why I wanted to use NordVPN Meshnet, a remote private DNS server that can be used even while being on mobile data or a public network, was not possible.

I can't think of a reason why would they choose Google DNS and make it non-configurable since it looks like they try to really be privacy oriented.
