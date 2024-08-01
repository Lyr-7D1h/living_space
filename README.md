# Living Space

[![Create Release](https://github.com/Lyr-7D1h/living_space/actions/workflows/release.yml/badge.svg)](https://github.com/Lyr-7D1h/living_space/actions/workflows/release.yml)
[![Docker Buildx](https://github.com/Lyr-7D1h/living_space/actions/workflows/docker.yml/badge.svg)](https://github.com/Lyr-7D1h/living_space/actions/workflows/docker.yml)

Welcome to Living Space! This is a simulation of a small ecosystem
where creatures interact with each other and their environment. Each
creature has a unique personality based on the
<a href="https://en.wikipedia.org/wiki/Big_Five_personality_traits">Big Five personality trait</a>
that influences how they walk and interact with other creatures. For
example a very caring creature gets very attracted to other creatures
or a more introverted creature will avoid other creatures and stay
more in place.

The idea is that over time you will have a living colorful ecosystem
that will change and adapt over time all based on the initial
creatures you create. Resembling the way our society works and
interacts with each other.

## Ideas
- procreate with other creatures
- on death explode color to neighboring tiles
- add anti-aliasing
- Running canvas state on a server
- Make steps independent of fps
- Animated creatures instead of pixels (https://www.youtube.com/watch?v=qlfh_rv6khY)

# Build

```sh
cd canvas
```

Configure `.env.dev` to point to your URL and to set how much information to show

```sh
npm run build
```

See `./dist/` for build files

```sh
cd ../broadcaster
cargo build --release
```

See `./target/release/broadcaster` for the broadcaster binary


## PI Kiosk

For setting up a kiosk device with a pi I followed https://reelyactive.github.io/diy/pi-kiosk/

```bash
supo apt-get update
supo apt-get upgrade
sudo apt-get install --no-install-recommends xserver-xorg xinit x11-xserver-utils
sudo apt-get install chromium-browser matchbox-window-manager xautomation unclutter fonts-noto-color-emoji git npm
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

echo "xinit /home/pi/kiosk -- vt$(fgconsole)" >> ~/.bashrc
```

Display Options > D2 Underscan > Enable compensation? [No]
System Options > S5 Boot / Auto Login > [B2 Console Autologin]

```bash
sudo raspi-config
```

Create `~/kiosk`

```bash
#!/usr/bin/env bash

if [[ -z "${SSH_CONNECTION}" ]]; then
  echo "SSH session"
  exit 0
fi

set -e

xset -dpms     # disable DPMS (Energy Star) features.
xset s off     # disable screen saver
xset s noblank # don't blank the video device
matchbox-window-manager -use_titlebar no &
unclutter &    # hide X mouse cursor unless mouse activated

cd ~

if [ ! -d ~/living_space ]; then
	git clone https://github.com/Lyr-7D1h/living_space.git
fi
cd ~/living_space/canvas
git pull
npm i
npm start &
cd ~/living_space/controller
npm i
npm start &
cd ~/living_space/server
cargo run

chromium-browser --display=:0 --kiosk --incognito --window-position=0,0 http://localhost:5174
```
