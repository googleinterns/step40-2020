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
 * The current possible tokenizers and their regular expressions to break up the text input. 
 * @enum {regexp}
 */
const TokenizerEnum = {
  WORD: /\S+\s*/g, 
  SENTENCE: /([^\.!\?]+[\.!\?]+)|([^\.!\?]+$)/g,
};

const DATAMUSE_ATTRIBUTES = {
  'Means like': 'ml', 
  'Synonym': 'syn',
  'Antonym': 'ant',
}

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
  let tokenizer;
  for (i = 0; i < radios.length; i++) {
    if (radios[i].checked && radios[i].value != 'NONE') {
      tokenizer = TokenizerEnum[radios[i].value];
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
  if (tokenizer != 'undefined') {
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
  const promises = [];
  for (i = 0; i < substrings.length; i++) {
    promises.push(callPerspective(substrings[i], lang, requestedAttributes));
  }
  await Promise.all(promises).then(resolvedResponses => {
    for (i = 0; i < substrings.length; i++) {
      addSubstring(substrings[i], analysisContainer, result, loadingEl, resolvedResponses[i], lang)
    }
  });

  analysisContainer.removeChild(loadingEl);
  analysisContainer.appendChild(result);
}

/** Updates the HTML elements for a substring that will be added to the detailed analysis output */
function addSubstring(substring, analysisContainer, result, loadingEl, response, lang) {
  // Check for errors and sort the attributes
  if (typeof(response.attributeScores) === 'undefined') {
    analysisContainer.removeChild(loadingEl);
    analysisContainer.appendChild(createAnyElement('p', 'Perspective API was not able to get scores for detailed analysis'));
    return;
  }
  const toxicityScore = response.attributeScores.TOXICITY.summaryScore.value;
  const attributes = sortAttributes(response);

  // Color the substring appropriately	
  const substringEl = createAnyElement('span', substring);
  substringEl.onclick = function() { setUpSuggestions(substring, lang); };
  colorSubstring(substringEl, toxicityScore);
     
  // Attach a tooltip (info-box for the substring)
  const tooltipEl = createTooltip(attributes);
  substringEl.appendChild(tooltipEl);
  result.appendChild(substringEl);
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
 
  // Set up radios for word type selection
  const radiosEl = document.createElement('div');
  radiosEl.appendChild(createAnyElement('b', 'Select type of word suggestion '));
  for (let attribute of Object.keys(DATAMUSE_ATTRIBUTES)) {
    radiosEl.appendChild(createIndividualRadio(attribute + '-radio', 'radio', DATAMUSE_ATTRIBUTES[attribute], 'form-check', attribute, 'datamuse-radios'));
  }
  suggestionsContainer.appendChild(radiosEl);
  document.getElementsByName('datamuse-radios')[0].checked = true;
 
  // Set up disclaimer text
  const disclaimerEl = createAnyElement('small', 'Suggestions are NOT provided by Perspective API, but instead Datamuse API');
  disclaimerEl.className = 'form-text text-muted';
  suggestionsContainer.appendChild(disclaimerEl);
 
  // Set up the submit button
  const submitButton = document.createElement('button');
  submitButton.innerHTML = 'Submit';
  submitButton.className = 'btn btn-primary';
  submitButton.onclick = function() { getSuggestions(text, lang); };
  suggestionsContainer.appendChild(submitButton);
}
 
/** Creates an individual radio */
function createIndividualRadio(id, type, value, radioClass, text, name) {
  const inputEl = document.createElement('input');
  inputEl.setAttribute('id', id);
  inputEl.setAttribute('type', type);
  inputEl.setAttribute('value', value);
  inputEl.setAttribute('name', name);
  inputEl.className = radioClass + '-input';
 
  const labelEl = createAnyElement('label', text);
  labelEl.setAttribute('for', id);
  labelEl.className = radioClass + '-label';
 
  const radioEl = document.createElement('div');
  radioEl.className = 'form-check form-check-inline';
  radioEl.appendChild(inputEl);
  radioEl.appendChild(labelEl);
  return radioEl;
}
 
/** Gets the suggestions & their score changes for a subtring based on the Datamuse API */
async function getSuggestions(text, lang) {
  // Clear previous results
  const resultsContainer = document.getElementById('perspective-datamuse-analysis');
  resultsContainer.innerHTML = '';
 
  // Gather the input
  const substringForSuggestions = getSuggestionsInput(text);
  if (!substringForSuggestions) {
    return;
  }
  const wordType = getSuggestionsWordType();
  
  // Get the toxicity score of original string 
  const toxicityScoreOriginal = await getOriginalToxicityScore(text, lang, resultsContainer);
  if (!toxicityScoreOriginal) {
    return;
  }
  
  // Get Datamuse API suggestions of substring
  const suggestions = await callDatamuse(substringForSuggestions, wordType);
  if (suggestions.length === 0) {
    resultsContainer.appendChild(createAnyElement('p', 'Datamuse API did not find any words or phrases matching your query'));
    return;
  }
 
  printSuggestions(text, substringForSuggestions, suggestions, toxicityScoreOriginal, lang, resultsContainer);
}
 
/** Prints the modified strings to the page with their Perspective scorings */
async function printSuggestions(text, substringForSuggestions, suggestions, toxicityScoreOriginal, lang, container) {
  const promises = [];
  const newSentences = []
  for (let i = 0; i < suggestions.length; i++) {
    const suggestion = suggestions[i].word;
    const newSentence = text.replace(substringForSuggestions, suggestion);
    newSentences.push(newSentence);
    promises.push(callPerspective(newSentence, lang, ['TOXICITY']));
  }
  await Promise.all(promises).then(resolvedPromises => {
    for (let i = 0; i < resolvedPromises.length; i++) {
      const toxicityScoreSuggestion = resolvedPromises[i].attributeScores.TOXICITY.summaryScore.value;
      const differenceInScores = toxicityScoreSuggestion - toxicityScoreOriginal;
      container.appendChild(createAnyElement('p', newSentences[i] + ' -> Change in TOXICITY score: ' +  decimalToPercentage(differenceInScores)));
    }
  });
}
 
/** Gets the original toxicity score of the substring the user selected for suggestions */
async function getOriginalToxicityScore(text, lang, container) {
  const perspectiveCallForOriginal = await callPerspective(text, lang, ['TOXICITY']);
  if (typeof(perspectiveCallForOriginal.attributeScores) === 'undefined') {
    container.appendChild(createAnyElement('p', 'Perspective API was not able to get scores suggestions'));
    return;
  }
  return perspectiveCallForOriginal.attributeScores.TOXICITY.summaryScore.value;
}
 
/** Gets the substring that the user wants suggestions on */
function getSuggestionsInput(text) {
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
  return substringForSuggestions;
}
 
/** Gets the user's selected word type for the suggestions */
function getSuggestionsWordType() {
  const radios = document.getElementsByName('datamuse-radios');
  let wordType; 
  for (i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      wordType = radios[i].value;
      break;
    }
  }
  return wordType;
}
 
/** Gets a max of 5 word replacement suggestion from Datamuse API */
async function callDatamuse(text, wordType) {
  words = text.replace(' ', '+');
  let response = await fetch('https://api.datamuse.com/words?' + wordType + '=' + words + '&max=5');
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
  return text.match(tokenizer);
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
