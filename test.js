const { JSDOM } = require("jsdom");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf-8");

const dom = new JSDOM(html, {
  url: "http://localhost/",
  runScripts: "dangerously",
  resources: "usable"
});

dom.window.addEventListener("error", (event) => {
  console.error("DOM Error:", event.error);
});

dom.window.onload = () => {
  try {
    console.log("Window loaded. Calling enterMode('quote')...");
    dom.window.enterMode('quote');
    console.log("enterMode('quote') succeeded!");
  } catch (err) {
    console.error("Caught error in enterMode:", err);
  }
};
