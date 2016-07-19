#!/bin/bash

if [ -z "$PM2" ]; then
    echo "node bin/composr"
else
    echo "TEST=$TEST"
fi