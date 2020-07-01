// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Collect the user's input and call Perspective on it
 */
async function submitInput() {
  const textElement = document.getElementById('textForAnalysis');
  if (!textElement) {
    return;
  }
  const langElement = document.getElementById('languageForAnalysis');
  if (!langElement) {
    return;
  }
  const response = await callPerspective(textElement.value, langElement.value);
}

/**
 * Call the perspective API
 */
async function callPerspective(text, lang) {
  const response = await fetch('/call_perspective', {
      method: 'POST',
      headers: {'Content-Type': 'application/json',},
      body: JSON.stringify({text: text, lang: lang})});
  const toxicityData = await response.json();
  displayPerspectiveOutput(toxicityData);
  loadChartsApi(toxicityData);
}

/**
 *  Display toxicity output on the webpage
 */
function displayPerspectiveOutput(toxicityData) {
  const outputElement = document.getElementById('perspective-output-container');
  if (!outputElement) {
    return;
  }
  outputElement.innerHTML = '';

  if (toxicityData.attributeScores) {
    for (let key in toxicityData.attributeScores) {
      if (toxicityData.attributeScores[key].summaryScore && 
        toxicityData.attributeScores[key].summaryScore.value) {
        if (document.getElementById('toxicity').checked == true && key == "TOXICITY") {
          attributeElement = createAnyElement('p', key + ": " + toxicityData.attributeScores[key].summaryScore.value);
          outputElement.appendChild(attributeElement);
        }
        if (document.getElementById('insult').checked == true && key == "INSULT") {
          attributeElement = createAnyElement('p', key + ": " + toxicityData.attributeScores[key].summaryScore.value);
          outputElement.appendChild(attributeElement);
        }
        if (document.getElementById('identity-attack').checked == true && key == "IDENTITY_ATTACK") {
          attributeElement = createAnyElement('p', key + ": " + toxicityData.attributeScores[key].summaryScore.value);
          outputElement.appendChild(attributeElement);
        }
        if (document.getElementById('profanity').checked == true && key == "PROFANITY") {
          attributeElement = createAnyElement('p', key + ": " + toxicityData.attributeScores[key].summaryScore.value);
          outputElement.appendChild(attributeElement);
        }
        if (document.getElementById('threat').checked == true && key == "THREAT") {
          attributeElement = createAnyElement('p', key + ": " + toxicityData.attributeScores[key].summaryScore.value);
          outputElement.appendChild(attributeElement);
        }
      }
    }
  }
}

/**
 * Create a 'tag' element with 'text' as its inner HTML
 */
function createAnyElement(tag, text) {
  const textElement = document.createElement(tag);
  textElement.innerHTML = text;
  return textElement;
}

/** Loads the Google Charts API */
function loadChartsApi(toxicityData) {
  google.charts.load('current', {'packages':['corechart']});
  google.charts.setOnLoadCallback(function() {drawBarChart(toxicityData);}); 
}

/** Draws a Google BarChart from a Perspective JSON. */
function drawBarChart(toxicityData) {
  const data = google.visualization.arrayToDataTable([[ {label: 'Attribute'}, {label: 'Score', type: 'number'}, {role: "style"}]]);

  Object.keys(toxicityData.attributeScores).forEach((attribute) => {
    var color = '#6B8E23'; // Green
    const score = toxicityData.attributeScores[attribute].summaryScore.value;
    if (score >= 0.8) {
      color = '#DC143C'; // Red
    } else if (score >= 0.2) {
      color = '#ffd800'; // Yellow
    }
    data.addRow([attribute, score, color]);
  });

  data.sort({column: 1, desc: false});

  const options = {
    title: 'Perspective Feedback',
    bars: 'horizontal',
    height: 700,
    legend: {position: "none"},
    theme: 'material', 
    hAxis: {viewWindow: {min: 0, max: 1}}
  };

  const chart = new google.visualization.BarChart(document.getElementById('chart-container'));
  chart.draw(data, options);
}
