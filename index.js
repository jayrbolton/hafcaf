// Constants
const APP_PREFIX = "hfcf"
const STATE_LS_KEY = APP_PREFIX + "_state";
const HALF_LIFE = 5;

// Message/data bus
const bus = {
    // Valid events/data
    tick: { subs: [], val: null },
    totalMg: { subs: [], val: 0 },
    history: { subs: [], val: [] },
    clickAddCaf: { subs: [], val: [] },
    clickReset: { subs: [], val: []},
    // Publish an event/data
    pub (label, msg) {
        if (!(label in this)) {
            throw new Error(`Label ${label} does not exist in bus ${bus}`);
        }
        let newVal = msg;
        if (typeof msg === "function") {
            newVal = msg(bus[label].val);
        }
        bus[label].val = newVal;
        bus[label].subs.forEach(callback => {
            callback(newVal);
        });
    },
    sub (label, fn) {
        if (!(label in this)) {
            throw new Error(`Label ${label} does not exist in bus ${bus}`);
        }
        bus[label].subs.push(fn);
    }
};

// Register a function that modifies the behavior of a dom element for a certain attribute name/val
function register (attr, fn) {
    const elems = document.querySelectorAll("[" + attr + "]");
    elems.forEach((elem) => {
        const val = elem.getAttribute(attr);
        fn(val, elem);
    });
}

// Add event listeners into the dom
// Example: <button _on="click:busEvent">
register("_on", function (attrVal, el) {
    const [eventName, label] = attrVal.split(":");
    el.addEventListener(eventName, ev => {
        bus.pub(label, ev);
    });
});

// Calculate total milligrams from across the histor:w
// Cache history to localstorage
bus.sub('history', (history) => {
    const totalMg = history.reduce((sum, hist) => sum + hist.currentAmount, 0);
    bus.pub('totalMg', totalMg);
    localStorage.setItem(STATE_LS_KEY, JSON.stringify({ history }));
});

bus.sub('tick', () => {
    bus.pub('history', (hist) => {
        // Decrement each entry in history
        // filter out entries <= 0
        // publish totalMg amount
        return hist.map(each => {
            if (each.currentAmount <= 10) {
                each.currentAmount = 0;
            } else {
                const delta = Number(new Date()) - each.time;
                const hours = delta / 1000 / 60 / 60;
                each.currentAmount = halfLife(each.origAmount, hours, HALF_LIFE);
            }
            return each;
        }).filter(each => each.currentAmount >= 0);
    });
});

setInterval(() => bus.pub('tick'), 3000);

const totalMgEl = document.querySelector('[_total_mg]');

bus.sub('clickAddCaf', (ev) => {
    bus.pub('history', history => {
        history.push({
            currentAmount: 50,
            origAmount: 50,
            time: Number(new Date()),
        });
        return history;
    });
});

bus.sub('clickReset', (ev) => {
    bus.pub('history', []);
});

bus.sub('totalMg', (total) => {
    totalMgEl.textContent = total.toFixed(1) + 'mg';
});

function halfLife (amount, hours, rate) {
    return amount * (0.5 ** (hours / rate));
}

// On pageload, load state from localStorage
const cachedStateStr = localStorage.getItem(STATE_LS_KEY);
if (cachedStateStr) {
    const cachedState = JSON.parse(cachedStateStr);
    bus.pub('history', cachedState.history);
}
