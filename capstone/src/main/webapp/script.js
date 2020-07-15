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

const ATTRIBUTES_BY_LANGUAGE = {
  'en': ['TOXICITY', 'SEVERE_TOXICITY', 'TOXICITY_FAST', 'IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'THREAT', 'SEXUALLY_EXPLICIT', 'FLIRTATION'],
  'es': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK_EXPERIMENTAL', 'INSULT_EXPERIMENTAL', 'PROFANITY_EXPERIMENTAL', 'THREAT_EXPERIMENTAL'],
  'fr': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK_EXPERIMENTAL', 'INSULT_EXPERIMENTAL', 'PROFANITY_EXPERIMENTAL', 'THREAT_EXPERIMENTAL'],
  'de': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'THREAT'],
  'it': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'THREAT'],
  'pt': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'THREAT']
};

/** Collects the user's input and submits it for analysis */
async function gatherInput() {
  // Get the submitted text and language
  const textElement = document.getElementById('textForAnalysis');
  if (!textElement) {
    return;
  }
  const langElement = document.getElementById('languageForAnalysis');
  if (!langElement) {
    return;
  }

  // Get the selected attributes
  const attributes = document.getElementById("available-attributes").getElementsByTagName('input');
  const requestedAttributes = [];
  for (const attribute of attributes) {
    if (attribute.checked) {
      requestedAttributes.push(attribute.value);	
    }	
  }

  // Get the selected analysis type
  document.getElementById('analysis-container').innerHTML = '';
  const radios = document.getElementsByName('analysisRadios');
  var delimiter = "";
  for (i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      delimiter = radios[i].value;
      break;
    }
  }

  handleInput(textElement.value, langElement.value, requestedAttributes, delimiter);
}

/** Submits the input to Perspective and loads the appropriate output */
async function handleInput(text, lang, requestedAttributes, delimiter) {
  // Draw the separating line for the output
  const separator = document.getElementById('separator-container');
  separator.innerHTML = '';
  separator.appendChild(document.createElement('hr')); 
	
  // Make Perspective call for the entire submission and load graph data
  const toxicityData = await callPerspective(text, lang, requestedAttributes);
  loadChartsApi(toxicityData);
  
  const userDecisionElement = document.getElementById('sheets-output-yes-no');
  if (userDecisionElement != null) {
    createSheet(toxicityData);
  }

  // Get detailed analysis if requested
  if (delimiter != "") {
    getAnalysis(text, lang, requestedAttributes, delimiter); 
  }
}

/** Prints detailed analysis of text by word or sentence */
async function getAnalysis(text, lang, requestedAttributes, delimiter) {
  // Set up the detailed analysis section
  const analysisContainer = document.getElementById('analysis-container')
  analysisContainer.appendChild(createAnyElement('b', 'Detailed Anaylsis'));
  const result = createAnyElement('p', '');
  result.className = 'detailed-analysis';
  
  // Generate the results for every substring of the input text
  const substrings = text.split(delimiter);
  for (i = 0; i < substrings.length; i++) {
    if (substrings[i] != '') {
      // Get the Perspective scores for the substring
      const response = await callPerspective(substrings[i], lang, requestedAttributes);
      const toxicityScore = response.attributeScores.TOXICITY.summaryScore.value;
      const substringEl = createAnyElement('span', substrings[i] + delimiter);

      // Color the substring appropriately			
      substringEl.className = 'green-background segment';
      if (toxicityScore >= 0.8) {
        substringEl.className = 'red-background segment';
      } else if (toxicityScore >= 0.2) {
        substringEl.className = 'yellow-background segment';
      }
     
      // Create the tooltip (info-box for the substring)
      const tooltipEL = document.createElement('div');
      const headerEl = document.createElement('div');
      const titleInfoEl = document.createElement('div');
      const imageEl = document.createElement('img');
      const bodyEl = document.createElement('div');
      const titleEl = createAnyElement('h3', 'Perspective Feedback');
      const subtitleEl = createAnyElement('p', 'based on selected attributes');

      tooltipEL.className = 'tooltip';      
      headerEl.className = 'header';
      titleInfoEl.className = 'title-info';
      titleEl.className = 'tooltip-title';
      subtitleEl.className = 'tooltip-subtitle';
      bodyEl.className = 'tooltip-body';

      imageEl.setAttribute('src', 'assets/apple-touch-icon.png');
      imageEl.setAttribute('alt', 'Perspective Logo');
			
      Object.keys(response.attributeScores).forEach((attribute) => {
        bodyEl.appendChild(createAnyElement('p', attribute + ': ' + decimalToPercentage(response.attributeScores[attribute].summaryScore.value)));
      });

      titleInfoEl.appendChild(titleEl);
      titleInfoEl.appendChild(subtitleEl);
      headerEl.appendChild(imageEl);
      headerEl.appendChild(titleInfoEl);
      tooltipEL.appendChild(headerEl);
      tooltipEL.appendChild(bodyEl);
      substringEl.appendChild(tooltipEL);
      result.appendChild(substringEl);
    }
  }
  analysisContainer.appendChild(result);
}

/** Converts decimals to percentages */
function decimalToPercentage(decimal) {
  const decimalAsString = decimal.toString();
  return decimalAsString.slice(2, 4) + '.' + decimalAsString.slice(4, 6) + '%';
}

/** Create a 'tag' element with 'text' as its inner HTML */
function createAnyElement(tag, text) {
  const textElement = document.createElement(tag);
  textElement.innerHTML = text;
  return textElement;
}

/** Calls the perspective API */
async function callPerspective(text, lang, requestedAttributes) {
  const response = await fetch('/call_perspective', {
    method: 'POST',
    headers: {'Content-Type': 'application/json',},
    body: JSON.stringify({text: text, lang: lang, requestedAttributes: requestedAttributes})});
  return await response.json();
}

/** Loads the Google Charts API */
function loadChartsApi(toxicityData) {
  google.charts.load('current', {'packages':['corechart']});
  google.charts.setOnLoadCallback(function() {drawBarChart(toxicityData);}); 
}

/** Draws a Google BarChart from a Perspective JSON. */
function drawBarChart(toxicityData) {
  document.getElementById('chart-container').innerHTML = '';
  const data = google.visualization.arrayToDataTable([[{label: 'Attribute'}, {label: 'Score', type: 'number'}, {role: "style"}]]);

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
    title: 'General Perspective Feedback',
    bars: 'horizontal',
    height: 700,
    legend: {position: "none"},
    theme: 'material', 
    hAxis: {viewWindow: {min: 0, max: 1}}
  };

  const chart = new google.visualization.BarChart(document.getElementById('chart-container'));
  chart.draw(data, options);
}

/** Shows the avaiable attributes given a language selected on text analyzer page */
function showAvailableAttributes() {
  const langElement = document.getElementById('languageForAnalysis');
  if (!langElement) {
    return;
  }
  const lang = langElement.value;
  const avaiableAttributesElement = document.getElementById('available-attributes');
  avaiableAttributesElement.innerHTML = '';
	
  const attributes = ATTRIBUTES_BY_LANGUAGE[lang];
  attributes.forEach(function(attribute) {
    const checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.value = attribute;
    checkbox.id = attribute + '-checkbox';
    checkbox.checked = true;
  
    const label = document.createElement('label');
    label.htmlFor = attribute + '-checkbox';
    label.appendChild(document.createTextNode(attribute));
  
    avaiableAttributesElement.appendChild(checkbox);
    avaiableAttributesElement.appendChild (document.createTextNode (" "));
    avaiableAttributesElement.appendChild(label);
    avaiableAttributesElement.appendChild (document.createTextNode (" "));
  });
}
