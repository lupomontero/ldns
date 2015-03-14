# ldns

Local `dns` server for development.

This basically allows you to have wildcard subdomains on your local machine,
which `/etc/hosts` doesn't allow.

## Installation

```sh
➜ npm install -g ldns
```

## Usage

```sh
➜ ldns -h

Usage:

ldns [ <options> ... ]

Options:

--port           Port to bind on.
--zones          Path to JSON file with zones info.
--debug          Switch logging level to debug.
-h, --help       Show this help.
-v, --version    Show ldns version.
```

## Zones

By default the following zones are used.

```json
{
  "dev": {
    "*": "127.0.0.1"
  },
  "docker": {
    "*": "192.168.59.103"
  }
}
```

These are based on my own use case, where I have a a proxy running on my machine
and a docker virtual machine. With the default zones the `dev` domain (and all
its subdomains, ie: `app1.dev`, `app2.dev`, ...) will resolve to `127.0.0.1` and
the `docker` domain and all its subdomains resolve to `192.168.59.103`.

You can also configure records for subdomains. In the example below `vm-1.vms`
and `vm-2.vms` resolve to two different IP addresses.

```json
{
  "local": {
    "*": "127.0.0.1"
  },
  "vms": {
    "vm-1": "192.168.59.103",
    "vm-2": "192.168.59.104"
  }
}
```

## Common pitfalls

By default `ldns` will try to bind to port `53`, which means that you
need to run `ldns` as `root`, otherwise you will get an error like this:

```sh
➜ ldns | bunyan
[2015-03-13T22:58:47.214Z] ERROR: ldns/1115 on Lupos-MacBook-Pro-Retina.local: bind EACCES (err.code=EACCES)
    Error: bind EACCES
        at errnoException (dgram.js:458:11)
        at dgram.js:211:28
        at dns.js:72:18
        at process._tickCallback (node.js:442:13)
        at Function.Module.runMain (module.js:499:11)
        at startup (node.js:119:16)
        at node.js:929:3
```

To run as `root` on default port (53) and in the background try this:

```sh
➜ sudo ldns &>/dev/null &
```

Or using `nohup` to dettach the process from the current shell.

```
➜ sudo nohup ldns &> /dev/null
```

Otherwise you can specify a higher port number via command line arguments.

```sh
➜ ldns --port 15353 | bunyan
➜ ldns --port 15353 --debug | bunyan
```

## License (MIT)

Copyright (c) 2015 Lupo Montero

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

