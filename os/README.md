numlockx off

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

# rpi-serve service
file: /lib/systemd/system/rpi-serve.service
content:
  [Unit]
  Description=Serve media for i4e
  After=network.target

  [Service]
  Type=simple
  User=enry
  ExecStart=/home/enry/.yarn/bin/serve /home/enry/.internet.for.elderly/media
  Restart=on-failure

  [Install]
  WantedBy=multi-user.target

sudo systemctl daemon-reload
sudo systemctl start rpi-serve
sudo systemctl enable rpi-serve
sudo systemctl status rpi-serve