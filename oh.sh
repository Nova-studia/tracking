#!/bin/bash
echo "Iniciando frontend..."
npm start & 

sleep 3

echo "Iniciando backend..."
cd BACKEND && npm start &
