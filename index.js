import { Packer } from "./bin-packing.js";

const calculate = (input) => {
  const data = [...input].sort(({ weight: w1 }, { weight: w2 }) => w2 - w1);
  const size = data.reduce((sum, item) => sum + item.weight, 0);
  const unitWidth = 200;
  const unitHeight = 120;
  let maxWeight = 0;
  
  // side effect to assign dimension and find maxWeight
  data.forEach((item) => {
    item.w = item.weight * unitWidth;
    item.h = unitHeight; // fixed height
    
    // save max weight
    if (item.weight > maxWeight) {
      maxWeight = item.weight;
    }
  });

  // Get fixed height and start packing
  const fixedHeight = Math.ceil(size / maxWeight) * unitHeight;
  const packer = new Packer(maxWeight * unitWidth, fixedHeight);
  packer.fit(data);
  
  // Get SVG strings
  return `<svg viewBox="0 0 ${maxWeight * unitWidth} ${fixedHeight}">
  ${
    data.map(({ name, value, w, h, fit: { x, y } }) => {
      return `<g fill="${value >= 0 ? "green" : "red" }">
      <rect
          x="${x}"
          y="${y}"
          width="${w}"
          height="${h}"
          style="stroke-width:1;stroke:white"/>
      <text
          x="${x + w / 2}"
          y="${y + h / 2}"
          fill="white" style="font-size: 2em;" dominant-baseline="middle" text-anchor="middle">
          ${name}\n
          ${parseFloat((value * 100).toFixed(2))}%
      </text>
  </g>`;
    }).join("\n")
  }
  </svg>`;
};

const whenGraphReady = fetch("./data.json").then((res) => res.json());
const textInput = document.getElementById("text-input");
const inputHints = document.getElementById("input-hints");
const rowInput = document.getElementById("row-input");
const rowInputHints = document.getElementById("row-hints");
const output = document.getElementById("output");

whenGraphReady.then((data) => {
  document.getElementById("text-input").value = JSON.stringify(data, null, 2);
  document.getElementById("output").innerHTML = calculate(data);
  run(data);
});

// main function and looping
const run = async (lastData) => {
  let nextData = lastData;
  // race until any of following happens
  await Promise.race([

    new Promise((acc) => { // row change
      rowInput.addEventListener("input", acc, { once: true });
    }).then((evt) => ({ from: "row", data: parseInt(rowInput.value, 10) })),
    new Promise((acc) => { // text change
      textInput.addEventListener("input", acc, { once: true });
    }).then((evt) => ({ from: "text", data: JSON.parse(textInput.value) })),

  ]).then(({from, data}) => {
    inputHints.classList.remove("valid");
    inputHints.classList.remove("invalid");
    rowInputHints.classList.remove("valid");
    rowInputHints.classList.remove("invalid");
    
    switch (from) {
      case "text":
        if (data.length > 50) {
          inputHints.classList.add("invalid");
          inputHints.textContent = "Data entry must be 50 or lower";
        } else if (data.some((item) => typeof item.weight !== "number" || (item.weight >> 0) !== item.weight )) { // Check number and integer
          inputHints.classList.add("invalid");
          inputHints.textContent = "Weight must be integer!";
        } else if (data.some((item) => typeof item.name !== "string" || item.name.length >= 50 )) {
          inputHints.classList.add("invalid");
          inputHints.textContent = "name must be string and less than 50 characters ( < 50 )";
        } else {
          inputHints.classList.add("valid");
          inputHints.textContent = "Valid JSON input";
          output.innerHTML = calculate(data);
          nextData = data;
        }
        break;
      case "row":
        if (isNaN(data) || (data >> 0 !== data)) {
          rowInputHints.classList.add("invalid");
          rowInputHints.textContent = "Row must be an integer";
        } else if (data > nextData.length) {
          rowInputHints.classList.add("invalid");
          rowInputHints.textContent = `Row must not exceed ${nextData.length}`;
        } else {
          rowInputHints.classList.add("valid");
          rowInputHints.textContent = "Valid row input";
          output.innerHTML = calculate(nextData.slice(0, data));
        }
        break;
    }
  }, (err) => { // parseRejected case
    console.log(err);
    inputHints.classList.add("invalid");
    inputHints.classList.remove("valid");
    inputHints.textContent = "Invalid JSON or row input";
  });
  
  // Run again until the end of the world
  return run(nextData);
}

// filter input from row
document.getElementById("row-input").onkeydown = (evt) => {
  if (["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown", "Backspace", "Delete"].includes(evt.code) || (/(Digit|Numpad)[0-9]/i).test(evt.code)) {
    return true;
  }
  return false
};


