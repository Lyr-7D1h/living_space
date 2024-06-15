# Living Space

Make creatures with different characteristics that will interact with each other, create offsprings, build and procreate.

## Ideas
- creature
  - color
  - behavior characteristics
  - tendencies
  - make connections with other creatures
  - procreate with other creatures
- decrease coloring strength the further from mid point of character paint is
- Create creatures on touch
- on death explode color to neighboring tiles
- different color space
- slowly create more and more advanced civilization over time
  - natural disasters to slow progress down
- add antialiasing
- Running canvas state on a server

# Kiosk

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