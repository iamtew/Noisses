# write static/img favicon from assets/favicon.png
favicon:
    mkdir -p static/img
    magick assets/favicon.png static/img/favicon.png
    magick assets/favicon.png -define icon:auto-resize=16,32,48,64,256 static/img/favicon.ico
