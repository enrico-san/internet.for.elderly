# .profile
xmodmap -e 'keycode 82 = XF86AudioRaiseVolume'
xmodmap -e 'keycode 86 = XF86AudioLowerVolume'
xmodmap -e 'keycode 23 = NoSymbol' # tab
xmodmap -e 'keycode 148 = NoSymbol' # calc
xmodmap -e 'keycode 163 = NoSymbol' # email
xmodmap -e 'keycode 180 = NoSymbol' # browser home

numlockx off
xmodmap -e 'keycode 77 = NoSymbol' # numlock

xset r off

# /home/pi/.config/autostart/yt4e.desktop
[Desktop Entry]
Type=Application
Name=YT4e
Exec=/usr/bin/npm start --prefix /home/pi/youtube.for.elderly/

# wifi
$> wpa_cli scan
$> wpa_cli scan_results

$> edit /etc/wpa_supplicant/wpa_supplicant.conf

ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=IT

network={
	ssid="..."
	psk="..."
	key_mgmt=WPA-PSK
}

$> wpa_cli -i wlan0 reconfigure
