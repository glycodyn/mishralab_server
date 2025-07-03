FROM ubuntu:20.04
RUN apt-get update && apt-get install -y wget
RUN wget https://github.com/ccsb-scripps/AutoDock-Vina/releases/download/v1.2.5/vina_1.2.5_linux_x86_64 -O /usr/local/bin/vina && chmod +x /usr/local/bin/vina
WORKDIR /data
CMD ["vina", "--help"]