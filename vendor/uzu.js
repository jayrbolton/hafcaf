// uzu.js
// Copyright 2022 Jay R Bolton
// License: MIT
// Use at your own risk.

// Event handler; publish and subscribe to messages
// This allows you to publish the same data to a single bus from many sources,
// and then define behavior on changes to that data in a single, canonical
// place.
// All messages must be declared up front in the `messages` param.
// Optionally pass in {cache: 'key_name'} in opts to cache everything to localstorage
// Access current data simply with `bus.vals.my_key`
export function Bus (events, opts = {}) {
    const bus = { subs: {}, vals: {} };
    for (const key in events) {
        bus.subs[key] = [];
        bus.vals[key] = events[key];
    }
    // Publish data to the bus
    bus.pub = function pub (label, val) {
        if (!(label in bus.subs)) {
            throw new Error(`Label ${label} does not exist in bus ${bus}`);
        }
        bus.vals[label] = val;
        // Calling all subscribers
        bus.subs[label].forEach(callback => {
            callback(val, bus.vals);
        });
        // Optionally cache full bus to localstorage
        if (opts.cache) {
            localStorage.setItem(opts.cache, JSON.stringify(bus.vals));
        }
    };
    // Subscribe to data changes
    bus.sub = function sub (label, fn) {
        if (!(label in bus.subs)) {
            throw new Error(`Label ${label} does not exist in bus ${bus}`);
        }
        bus.subs[label].push(fn);
    };
    if (opts.cache) {
        let existing = localStorage.getItem(opts.cache);
        if (existing) {
            try {
                existing = JSON.parse(existing);
            } catch (e) {
                console.error(`Unable to parse JSON from localStorage. Run localStorage.removeItem(${opts.cache}) to reset.`);
                throw e;
            }
            bus.vals = existing;
            // Call all subscribers with new values
            for (const key in bus.subs) {
                bus.subs[key].forEach(cb => cb(val, bus.vals));
            }
        } else {
            localStorage.setItem(opts.cache, JSON.stringify(bus.vals));
        }
    }
    return bus;
}

// Convenience function for creating dom elements
export function El (tag, opts = {}, children = []) {
    const el = document.createElement(tag);
    // Child nodes
    for (const child of children) {
        try {
            el.appendChild(child);
        } catch (e) {
            // Fallback to appending anything as a text node
            const textNode = document.createTextNode(String(child));
            el.appendChild(textNode);
        }
    }
    // CSS properties
    if (opts.style) {
        for (const key in opts.style) {
            el.style[key] = opts.style[key];
        }
    }
    // Direct properties
    if (opts.props) {
        for (const key in opts.props) {
            if(!(key in el)) {
                throw new Error(`Invalid prop: ${key}`);
            }
            el[key] = opts.props[key];
        }
    }
    // Attributes
    if (opts.attrs) {
        for (const key in opts.attrs) {
            el.setAttribute(key, opts.attrs[key]);
        }
    }
    // Data attributes
    if (opts.dataset) {
        for (const key in opts.dataset) {
            el.dataset[key] = opts.dataset[key];
        }
    }
    // Event handlers
    if (opts.on) {
        for (const key in opts.on) {
            el.addEventListener(key, opts.on[key]);
        }
    }

    return el;
}