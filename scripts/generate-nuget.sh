#!/usr/bin/env bash

set -o errexit

trap cleanup EXIT

ganache_port=8545

cleanup() {
  if [[ -n "$ganache_pid" ]] && ps -p $ganache_pid > /dev/null; then
    kill -9 $ganache_pid
  fi
}

ganache_running() {
    </dev/tcp/127.0.0.1/${ganache_port}
}

start_ganache() {
    npx ganache-cli --port "$ganache_port" > /dev/null &
    
    ganache_pid=$!

    echo "Waiting for ganache to launch on port "${ganache_port}"..."

    while ! ganache_running; do
        sleep 1
    done

    echo "Ganache launched!"
}

if ganache_running; then
  echo "Using existing ganache instance"
else
  echo "Starting our own ganache instance"
  start_ganache
fi

npx truffle version

npx truffle exec ./scripts/prepare-nuget-project.js --network development --compile --contract $1 --package-version $2

if [[ ! -f "./build/tools/Nethereum.Generator.Console" ]]; then
    dotnet tool install Nethereum.Generator.Console --tool-path ./build/tools
fi

./build/tools/Nethereum.Generator.Console generate from-project --projectPath "./build/nugets/Lykke.PrivateBlockchain.${1}"

dotnet pack "./build/nugets/Lykke.PrivateBlockchain.${1}" --configuration Release






