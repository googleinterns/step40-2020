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
  WORD: /(\S+\s*)|(\s*\S+)/g, 
  SENTENCE: /([^\.!\?\n\r]+[\.!\?\n\r]+)|([^\.!\?\n\r]+$)/g,
};

const DATAMUSE_ATTRIBUTES = {
  'Means like': 'ml', 
  'Synonym': 'rel_syn',
  'Antonym': 'rel_ant',
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
  document.getElementById('general-analysis-container').innerHTML = '';
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
  document.getElementById('perspective-datamuse-analysis').innerHTML = '';
  document.getElementById('perspective-datamuse-chart').innerHTML = '';
  document.getElementById('perspective-datamuse-extras').innerHTML = '';
  document.getElementById('about-container').style.display = 'none';

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

/** Shows detailed analysis of text by word or sentence */
async function getAnalysis(text, lang, requestedAttributes, tokenizer) {
  // Set up the detailed analysis section
  const analysisContainer = document.getElementById('general-analysis-container');
  analysisContainer.appendChild(createAnyElement('b', 'Detailed Anaylsis'));
  const loadingEl = document.createElement('p');
  loadingEl.className = 'spinner-border';
  analysisContainer.appendChild(loadingEl);
  const result = document.createElement('p');
  result.className = 'detailed-analysis';
  
  // Generate the results for every substring of the input text
  const substrings = getSubstrings(text, tokenizer);
  const promises = [];
  for (let i = 0; i < substrings.length; i++) {
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

  // Set up replacements function call and color the substring appropriately	
  const substringEl = document.createElement('span');
  const words = getSubstrings(substring, TokenizerEnum['WORD']);
  for (let i = 0; i < words.length; i++) {
    const wordEl = createAnyElement('span', words[i]);
    const bareWord = words[i].replace(/[\s.,\/#!$%\^&\*;:{}=\-_`~()]/g, ''); // Remove any punctuation & whitespace
    wordEl.onclick = function() { setUpReplacements(substring, lang, bareWord); }
    wordEl.classList.add('output-word'); 
    substringEl.appendChild(wordEl);
  }
  colorSubstring(substringEl, toxicityScore);
     
  // Attach a tooltip (info-box for the substring)
  const tooltipEl = createTooltip(attributes);
  substringEl.appendChild(tooltipEl);
  result.appendChild(substringEl);
}
 
/** Sets up the replacements section */
function setUpReplacements(text, lang, substringForReplacements) {
  // Clear previous results
  document.getElementById('perspective-datamuse-chart').innerHTML = '';
  document.getElementById('perspective-datamuse-extras').innerHTML = '';

  document.getElementById('about-container').style.display = 'block';

  getReplacements(text, lang, substringForReplacements);
  showDataMuseWordReplacementOptions(text, lang, substringForReplacements);
}

/** Gets the replacements & their score changes for a subtring based on the Datamuse API */
async function getReplacements(text, lang, substringForReplacements) {
  // Clear previous results
  const analysisContainer = document.getElementById('perspective-datamuse-analysis');
  analysisContainer.innerHTML = '';
  document.getElementById('perspective-datamuse-chart').innerHTML = '';

  // Set up loading spinner
  const loadingEl = document.createElement('p');
  loadingEl.className = 'spinner-border';
  analysisContainer.appendChild(loadingEl);

  // Get the word type
  let wordType = getReplacementsWordType();
  if (!wordType) {
    wordType = DATAMUSE_ATTRIBUTES['Means like'];
  }

  // Get the toxicity score of original string 
  const toxicityOfOriginal = await getOriginalToxicity(text, lang, analysisContainer, loadingEl);
  if (!toxicityOfOriginal) {
    return;
  }
  
  // Get Datamuse API replacements of substring
  const replacements = await callDatamuse(substringForReplacements, wordType);
  if (replacements.length === 0) {
    analysisContainer.removeChild(loadingEl)
    analysisContainer.appendChild(createAnyElement('b', 'Datamuse API did not find any words or phrases matching your query'));
    return;
  }
 
  renderReplacements(text, substringForReplacements, replacements, toxicityOfOriginal, lang, analysisContainer, loadingEl);
}

/** Renders the modified strings to the page with their Perspective TOXICITY scorings */
async function renderReplacements(text, substringForReplacements, replacements, toxicityOfOriginal, lang, container, loadingEl) {
  // Get Perspective scores on new sentences
  const promises = [];
  const newSentences = [];
  for (let i = 0; i < replacements.length; i++) {
    const replacement = replacements[i].word;
    const newSentence = text.replace(substringForReplacements, replacement);
    newSentences.push(newSentence);
    promises.push(callPerspective(newSentence, lang, ['TOXICITY']));
  }

  await Promise.all(promises).then(resolvedPromises => {
    // Calculate and sort the score differences of the new sentences
    const sentenceData = [];
    for (let i = 0; i < resolvedPromises.length; i++) {
      const toxicityOfReplacement = resolvedPromises[i].attributeScores.TOXICITY.summaryScore.value;
      const scoreDiff = toxicityOfReplacement - toxicityOfOriginal;
      sentenceData.push({
        replacement: replacements[i].word,
        sentence: newSentences[i], 
        scoreDiff: scoreDiff,
      });
    }
    sentenceData.sort(function(a, b) {
      return a.scoreDiff - b.scoreDiff;
    });
 
    container.removeChild(loadingEl);

    // Render the new sentences and their score differences
    for (let i = 0; i < sentenceData.length; i++) {
      renderSentence(container, sentenceData[i])
    }

    // Draw the chart
    drawDatamuseChart(resolvedPromises, substringForReplacements, toxicityOfOriginal, replacements);
  });
}
 
/** Renders a sentence replacement with the correct style and data  */ 
function renderSentence(container, sentenceData) {
  const isPositive = sentenceData.scoreDiff > 0;
  const className = isPositive ? 'red-background' : 'green-background';
  const sign = isPositive ? '+' : '';
  const styledSentence = sentenceData.sentence.replace(sentenceData.replacement, '<b>' + sentenceData.replacement + '</b>');
  const scoreEl = '<span class="' + className + '">' +  sign + decimalToPercentage(sentenceData.scoreDiff) + '</span>';
  container.appendChild(createAnyElement('p', styledSentence + ' -> ' + scoreEl));
}

/** Gives the user extra options after they get the replacement data */
function showDataMuseWordReplacementOptions(text, lang, substringForReplacements) {
  // Clear any previous options & print separating line
  container = document.getElementById('perspective-datamuse-extras');
  container.innerHTML = '';
  container.appendChild(document.createElement('hr'));

  // Set up radios for word type selection
  const radiosEl = document.createElement('div');
  radiosEl.appendChild(createAnyElement('p', 'Different type of word replacement?'));
  for (let attribute of Object.keys(DATAMUSE_ATTRIBUTES)) {
    radiosEl.appendChild(createIndividualRadio(attribute + '-radio', 'radio', DATAMUSE_ATTRIBUTES[attribute], 'form-check', attribute, 'datamuse-radios'));
  }
  container.appendChild(radiosEl);
  document.getElementsByName('datamuse-radios')[0].checked = true;

  // Set up submit button for word type selection
  const submitButton = document.createElement('button');
  submitButton.innerHTML = 'Submit';
  submitButton.className = 'btn btn-primary';
  submitButton.onclick = function() { getReplacements(text, lang, substringForReplacements); };
  container.appendChild(submitButton);
}

/** Gets the original toxicity score of the substring the user selected for replacements */
async function getOriginalToxicity(text, lang, container, loadingEl) {
  const response = await callPerspective(text, lang, ['TOXICITY']);
  if (typeof(response.attributeScores) === 'undefined') {
    container.removeChild(loadingEl)
    container.appendChild(createAnyElement('p', 'Perspective API was not able to get scores replacements'));
    return;
  }
  return response.attributeScores.TOXICITY.summaryScore.value;
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

/** Gets the user's selected word type for the replacements */
function getReplacementsWordType() {
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
 
/** Gets a max of 5 word replacement replacement from Datamuse API */
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
  const subtitleEl = createAnyElement('p', 'click to get replacements for this word');

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
  google.charts.setOnLoadCallback(function() {drawGeneralChart(toxicityData); }); 
}

/** Draws a Google BarChart for Datamuse replacement analysis. */
function drawDatamuseChart(responses, substringForReplacements, toxicityOfOriginal, replacements) {
  const chartContainer = document.getElementById('perspective-datamuse-chart');
  chartContainer.innerHTML = '';
  const loadingEl = document.createElement('div');
  loadingEl.className = 'spinner-border';
  chartContainer.appendChild(loadingEl);
  const data = google.visualization.arrayToDataTable([[{label: 'replacement'}, {label: 'Score', type: 'number'}, {role: "style"}]]);

  for (let i = 0; i < replacements.length; i++) {
    const score = responses[i].attributeScores['TOXICITY'].summaryScore.value;
    const color = getColor(score);
    data.addRow([replacements[i].word, score, 'stroke-color: #000000; stroke-width: 1; fill-color: ' + color]);
  }
  data.addRow(['ORIGINAL', toxicityOfOriginal, 'Black']);

  data.sort({column: 1, desc: false});

  const options = {
    title: 'Perpsective TOXICITY Score When "' + substringForReplacements + '" is Replaced With...',
    bars: 'horizontal',
    height: 300,
    legend: {position: "none"},
    theme: 'material', 
    hAxis: {viewWindow: {min: 0, max: 1}}
  };

  const chart = new google.visualization.BarChart(chartContainer);
  chartContainer.removeChild(loadingEl);
  chart.draw(data, options);
}

/** Draws a Google BarChart from a Perspective JSON. */
function drawGeneralChart(toxicityData) {
  const chartContainer = document.getElementById('general-chart-container');
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
    const score = toxicityData.attributeScores[attribute].summaryScore.value;
    const color = getColor(score);
    data.addRow([attribute, score, 'stroke-color: #000000; stroke-width: 1; fill-color: ' + color]);
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

/** Gives the appropriate color for a bar in a barchart given its score */
function getColor(score) {
  if (score >= 0.8) {
    return '#6200EA'; // Darkest purple
  } else if (score >= 0.6) {
    return '#8133EE'; // Dark purple
  } else if (score >= 0.4) {
    return '#A166F2'; // Mild purple
  } else if (score >= 0.2) {
    return '#E0CCFB'; // Light purple
  } else {
    return '#F6F2FC'; // Lightest purple
  }
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
