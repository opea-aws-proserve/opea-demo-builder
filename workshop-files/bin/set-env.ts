#!/usr/bin/env node

const [a,b,...args] = process.argv;

args.forEach(c => {
    const [d,e] = c.split("=");

    process.env[d] = e;
})