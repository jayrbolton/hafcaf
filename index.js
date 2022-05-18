import { El, Bus } from "./vendor/uzu.js";

const HALFLIFE = 5.6;

function App () {
  const bus = Bus({
    totalMg: 0,
    history: [],
  }, {cache: '_hafcaf'});
  const events = {
    clickConsume: ev => {
      const history = bus.vals.history;
      history.push({
        time: (new Date()).getTime(),
        origAmount: 50,
        currentAmount: 50,
      });
      bus.pub('history', history);
      const totalMg = calcTotal(bus.vals.history);
      bus.pub('totalMg', totalMg);
    },
    clickReset: ev => {
      const confirmed = confirm("Are you sure you want to reset?");
      if (confirmed) {
        bus.pub('history', []);
        bus.pub('totalMg', 0);
      }
    },
  };
  const el = El('div', {
    style: {
      margin: '0',
      padding: '2rem 0',
      textAlign: 'center',
      maxWidth: '20rem',
      margin: 0,
      padding: 0,
    }
  }, [
    ConsumeButton(bus, events),
    El('h2', {}, ["Current level:"]),
    TotalText(bus),
    ResetButton(bus, events),
  ]);
  setInterval(() => {
    const history = bus.vals.history.map(hist => {
      const now = (new Date()).getTime();
      const delta = now - hist.time;
      const hours = delta / 1000 / 60 / 60;
      hist.currentAmount = halfLife(
        hist.origAmount,
        hours,
        HALFLIFE,
      );
      return hist;
    }).filter(hist => hist.currentAmount > 1);
    bus.pub('history', history);
    bus.pub('totalMg', calcTotal(history));
  }, 1000)
  return {el, bus};
}

function ConsumeButton(bus, events) {
  const el = El('button', {
    style: {
      outline: 0,
      border: '2px solid #ccc',
      background: '#444',
      fontSize: '1.2rem',
      padding: '0.5rem 0.8rem',
      color: 'white',
      cursor: 'pointer',
    },
    on: {
      click: ev => {
        events.clickConsume();
      }
    }
  }, [
    '+ Consume caffeine'
  ])
  return el;
}

function ResetButton (bus, events) {
  const el = El('button', {
    on: {
      click: events.clickReset,
    },
    style: {
      outline: 0,
      border: '2px solid #ccc',
      background: '#444',
      fontSize: '1rem',
      padding: '0.5rem 0.8rem',
      color: 'white',
      cursor: 'pointer',
      marginTop: "2rem",
    },
  }, [
    "Reset",
  ]);
  return el;
}

function TotalText (bus) {
  const totalText = (n) => {
    return n.toFixed(1) + "mg";
  }
  const el = El('h1', {
    style: {
      fontSize: "3rem",
    }
  }, [totalText(bus.vals.totalMg)]);
  bus.sub('totalMg', totalMg => {
    el.textContent = totalText(bus.vals.totalMg);
  })
  return el;
}

function calcTotal (history) {
  return history.reduce((sum, hist) => sum + hist.currentAmount, 0);
}

function halfLife (amount, hours, rate) {
  return amount * (0.5 ** (hours / rate));
}

const app = App();
window._bus = app.bus;
document.body.appendChild(app.el);