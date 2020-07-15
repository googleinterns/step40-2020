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
  var tokenizer = "";
  for (i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      tokenizer = radios[i].value;
      break;
    }
  }

  handleInput(textElement.value, langElement.value, requestedAttributes, tokenizer);
}

/** Submits the input to Perspective and loads the appropriate output */
async function handleInput(text, lang, requestedAttributes, tokenizer) {
  // Remove any previous output
	document.getElementById('suggestions-input-container').innerHTML = '';
	document.getElementById('perspective-datamuse-analysis').innerHTML = '';

  // Draw the separating line for the output
  const separator = document.getElementById('separator-container');
  separator.innerHTML = '';
  separator.appendChild(document.createElement('hr')); 
	
  // Make Perspective call for the entire submission and load graph data
  const toxicityData = await callPerspective(text, lang, requestedAttributes);
  loadChartsApi(toxicityData);

  // Get detailed analysis if requested
  if (tokenizer != "") {
    getAnalysis(text, lang, requestedAttributes, tokenizer); 
  }
}

/** Prints detailed analysis of text by word or sentence */
async function getAnalysis(text, lang, requestedAttributes, tokenizer) {
  // Set up the detailed analysis section
  const analysisContainer = document.getElementById('analysis-container');
  analysisContainer.appendChild(createAnyElement('b', 'Detailed Anaylsis'));
  const loadingEl = document.createElement('p');
  loadingEl.className = 'spinner-border';
  analysisContainer.appendChild(loadingEl);
  const result = document.createElement('p');
  result.className = 'detailed-analysis';
  
  // Generate the results for every substring of the input text
  const substrings = getSubstrings(text, tokenizer);
  for (i = 0; i < substrings.length; i++) {
    if (substrings[i] != '') {
      // Get the Perspective scores for the substring & sort them descending
      const response = await callPerspective(substrings[i], lang, requestedAttributes);
      if (typeof(response.error) != 'undefined') {
        analysisContainer.removeChild(loadingEl);
        analysisContainer.appendChild(createAnyElement('p', 'Perspective API was not able to get scores for detailed analysis'));
        return;
      }
      const toxicityScore = response.attributeScores.TOXICITY.summaryScore.value;
      const attributes = sortAttributes(response);

      // Set up and color the substring appropriately	
      const substring = substrings[i];
      const substringEl = createAnyElement('span', substring);
      substringEl.onclick = function() { setUpSuggestions(substring, lang); };
      colorSubstring(substringEl, toxicityScore);
     
      // Attach a tooltip (info-box for the substring)
      const tooltipEl = createTooltip(attributes);
      substringEl.appendChild(tooltipEl);
      result.appendChild(substringEl);
    }
  }
  analysisContainer.removeChild(loadingEl);
  analysisContainer.appendChild(result);
}

/** Sets up the suggestions module */
function setUpSuggestions(text, lang) { 
  // Set up the header containing the selected segment
  const suggestionsContainer = document.getElementById('suggestions-input-container');
  suggestionsContainer.innerHTML = '';
  suggestionsContainer.appendChild(createAnyElement('p', text));

  // Set up the input box for the substring the user wants suggestions for
  const inputBox = document.createElement('input');
  inputBox.className = 'form-control';
  inputBox.setAttribute('id', 'input-box')
  inputBox.setAttribute('placeholder', 'Input substring of this segment you woud like suggestions for');
  suggestionsContainer.appendChild(inputBox);

  // Set up the submit button
  const submitButton = document.createElement('button');
  submitButton.innerHTML = 'Submit';
  submitButton.className = 'btn btn-primary';
  submitButton.onclick = function() { getSuggestions(text, lang); };
  suggestionsContainer.appendChild(submitButton);
}

/** Gets the suggestions & their score changes for a subtring based on the Datamuse API */
async function getSuggestions(text, lang) {
  // Handle the input from the input box
  const inputBox = document.getElementById('input-box');
  if (!inputBox) {
    return;
  }
  const substringForSuggestions = inputBox.value;
  if (text.indexOf(substringForSuggestions) == -1) {
  	alert("Substring must be in the selected segment");
  	return;
  } else if (substringForSuggestions == '') {
    alert('Input cannot be empty');
    return;
  }
  inputBox.innerHTML = '';
  
  const resultsContainer = document.getElementById('perspective-datamuse-analysis');
  resultsContainer.innerHTML = '';
  const perspectiveCallForOriginal = await callPerspective(text, lang, ['TOXICITY']);
  const toxicityScoreOriginal = perspectiveCallForOriginal.attributeScores.TOXICITY.summaryScore.value;
  const suggestions = await callDatamuse(substringForSuggestions);

  // Print the suggestions and their differences in toxicity scores
  for (i = 0; i < suggestions.length; i++) {
    const suggestion = suggestions[i].word;
    const newSentence = text.replace(substringForSuggestions, suggestion);
    const perspectiveScoresForSuggestion = await callPerspective(newSentence, lang, ['TOXICITY']);
    const toxicityScoreSuggestion = perspectiveScoresForSuggestion.attributeScores.TOXICITY.summaryScore.value;
    const differenceInScores = toxicityScoreSuggestion - toxicityScoreOriginal;
    resultsContainer.appendChild(createAnyElement('p', newSentence + ' -> Change in TOXICITY score: ' +  decimalToPercentage(differenceInScores)));
  }
}

/** Gets word replacement suggestion from Datamuse API */
async function callDatamuse(text) {
  words = text.replace(' ', '+');
  let response = await fetch('https://api.datamuse.com/words?ml=' + words + '&max=5');
  return await response.json();
}

/** Sorts a Perspective API response's attribute values in descending order */
function sortAttributes(response) { 
  const attributes = [];
  Object.keys(response.attributeScores).forEach((attribute) => {
    attributes.push([attribute, response.attributeScores[attribute].summaryScore.value]);
  });
  attributes.sort(function(a, b) {
    return b[1] - a[1];
  });
  return attributes;
}

/** Breaks up a string into its words or sentences and puts the substrings in an array */
function getSubstrings(text, tokenizer) {
  if (tokenizer === ' ') {
    return text.match(/\S+\s*/g);  // Regular expression for getting words
  } else {
    return text.match(/([^\.!\?]+[\.!\?]+)|([^\.!\?]+$)/g);  // Regular expression for getting sentences
  }
}

/** Colors a substring in the detailed analysis appropriately */
function colorSubstring(substringEl, toxicityScore) { 
  substringEl.className = 'green-background segment';
  if (toxicityScore >= 0.8) {
    substringEl.className = 'red-background segment';
  } else if (toxicityScore >= 0.2) {
    substringEl.className = 'yellow-background segment';
  }
}

/** Creates a tooltip for a substring in the detailed analysis */
function createTooltip(attributes) {
  const tooltipEl = document.createElement('div');
  const headerEl = document.createElement('div');
  const titleInfoEl = document.createElement('div');
  const imageEl = document.createElement('img');
  const bodyEl = document.createElement('div');
  const titleEl = createAnyElement('h3', 'Perspective Feedback');
  const subtitleEl = createAnyElement('p', 'based on selected attributes');

  tooltipEl.className = 'tooltip';      
  headerEl.className = 'header';
  titleInfoEl.className = 'title-info';
  titleEl.className = 'tooltip-title';
  subtitleEl.className = 'tooltip-subtitle';
  bodyEl.className = 'tooltip-body';

  imageEl.setAttribute('src', 'assets/apple-touch-icon.png');
  imageEl.setAttribute('alt', 'Perspective Logo');

  titleInfoEl.appendChild(titleEl);
  titleInfoEl.appendChild(subtitleEl);
  headerEl.appendChild(imageEl);
  headerEl.appendChild(titleInfoEl);
  tooltipEl.appendChild(headerEl);
  tooltipEl.appendChild(bodyEl);

  for (const attribute of attributes) {
    bodyEl.appendChild(createAnyElement('p', attribute[0] + ': ' + decimalToPercentage(attribute[1])));
  }
  return tooltipEl;
}

/** Converts decimals to percentages */
function decimalToPercentage(decimal) {
  return (decimal * 100).toFixed(2) + '%';
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
  const chartContainer = document.getElementById('chart-container');
  chartContainer.innerHTML = '';
  if (typeof(toxicityData.error) != 'undefined') {
    chartContainer.appendChild(createAnyElement('p', 'Perspective API was not able to get general scores for the bar chart'));
    return;
  }
  const loadingEl = document.createElement('div');
  loadingEl.className = 'spinner-border';
  chartContainer.appendChild(loadingEl);
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

  const chart = new google.visualization.BarChart(chartContainer);
  chartContainer.removeChild(loadingEl);
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
    avaiableAttributesElement.appendChild(document.createTextNode(" "));
    avaiableAttributesElement.appendChild(label);
    avaiableAttributesElement.appendChild(document.createTextNode(" "));
  });
}
