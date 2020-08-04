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

const MAX_TOTAL_DATAMUSE_RESULTS = 100;
const MAX_DATAMUSE_RESULTS_PER_WORD = 10;

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
  document.getElementById('colored-analysis-container').innerHTML = '';
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
  document.getElementById('colored-analysis-container').innerHTML = '';
  document.getElementById('segment-data').innerHTML = '';
  document.getElementById('detailed-analysis-header').innerHTML = '';
  document.getElementById('perspective-datamuse-analysis').innerHTML = '';
  document.getElementById('perspective-datamuse-chart').innerHTML = '';
  document.getElementById('perspective-datamuse-extras').innerHTML = '';
  document.getElementById('perspective-datamuse-extremes').innerHTML = '';
  document.getElementById('perspective-datamuse-header').style.display = 'none';
	
  // Make Perspective call for the entire submission and load graph data
  const toxicityData = await callPerspective(text, lang, requestedAttributes);
  loadChartsApi(toxicityData);

  // Get detailed analysis if requested
  if (tokenizer) {
    getAnalysis(text, lang, requestedAttributes, tokenizer); 
  }
}

/** Shows detailed analysis of text by word or sentence */
async function getAnalysis(text, lang, requestedAttributes, tokenizer) {
  // Set up the detailed analysis section
  const headerContainer = document.getElementById('detailed-analysis-header');
  headerContainer.innerHTML = '';
  headerContainer.appendChild(createAnyElement('h3', 'Detailed Anaylsis'));
  const analysisContainer = document.getElementById('colored-analysis-container');
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

  // Print analysis and set up sidebar data element
  analysisContainer.removeChild(loadingEl);
  const segmentDataEl = document.getElementById('segment-data');
  segmentDataEl.innerHTML = '';
  segmentDataEl.appendChild(createAnyElement('h5', 'Click on any segment for details'));	
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

  // Break up and color the segment appropriately	
  const substringEl = document.createElement('span');
  const wordElts = [];
  const words = getSubstrings(substring, TokenizerEnum['WORD']);
  if (words) {
    for (let i = 0; i < words.length; i++) {
      const wordEl = createAnyElement('span', words[i]);
      const bareWord = words[i].replace(/[\s.,\/#!$%\^&\*;:{}=\-_`~()]/g, ''); // Remove any punctuation & whitespace
      wordElts.push([wordEl, bareWord]);
      substringEl.appendChild(wordEl);
    }
  } else {
    substringEl.appendChild(createAnyElement('span', substring));
  }
  colorSubstring(substringEl, toxicityScore);

  // Set up analysis replacement function call after user clicks on segment
  substringEl.onclick = function() { handleSegmentClick(attributes, substringEl, wordElts, substring, lang); }
  result.appendChild(substringEl);
}

/** Appropriately sets the onclick attribute of a detailed analyis segment */ 
function handleSegmentClick(attributes, substringEl, wordElts, substring, lang) {
  showAttributes(attributes);
  // Remove properties from previously clicked-on segments
  const segments = document.getElementsByClassName('segment');
  for (let i = 0; i < segments.length; i++) {
    segments[i].classList.remove('purple-underline');
    for (let j = 0; j < segments[i].childNodes.length; j++) {
      segments[i].childNodes[j].className = '';
      segments[i].childNodes[j].onclick = null;
    }
  }
  // Allow replacements call for clicked-on segment
  substringEl.classList.add('purple-underline');
  for (let word of wordElts) {
    word[0].onclick = function() { setUpReplacements(substring, lang, word[1]);};
    word[0].classList.add('output-word');
  }
}

/** Displays the attributes for a clicked-on segment */
function showAttributes(attributes) {
  const container = document.getElementById('segment-data');
  container.innerHTML = '';
  container.appendChild(createAnyElement('b', 'Top attributes'));
  for (let i = 0; i < attributes.length && i < 3; i++) {
    container.appendChild(createAnyElement('p', attributes[i][0] + ': ' + decimalToPercentage(attributes[i][1])));
  }
  container.appendChild(createAnyElement('b', 'Click on any word in selected segment for replacements'))
}

/** Sets up the replacements section */
function setUpReplacements(text, lang, substringForReplacements) {
  // Clear previous results
  document.getElementById('perspective-datamuse-chart').innerHTML = '';
  document.getElementById('perspective-datamuse-extras').innerHTML = '';

  document.getElementById('perspective-datamuse-header').style.display = 'block';

  getReplacements(text, lang, substringForReplacements);
  showDataMuseWordReplacementOptions(text, lang, substringForReplacements);
}

/** Gets the most extreme word replacements on a string */
async function getExtremes(text, lang) {
  // Remove any previous output & set up loading spinner
  const container = document.getElementById('perspective-datamuse-extremes');
  container.innerHTML = '';
  const loadingEl = document.createElement('p');
  loadingEl.className = 'spinner-border';
  container.appendChild(loadingEl);

  // Get the words & place a limit on the max number of requests
  const words = text.split(/[\s.,\/#!$%\^&\*;:{}=\-_`~()]/g); // Remove any punctuation or whitespace
  let numResults = getNumResults(words.length);

  // Get the new sentences and their scores
  const replacements = await getAllReplacements(words, numResults);
  const newSentences = [];
  const styledSentences = [];
  const promises = [];
  for (let i = 0; i < replacements.length; i++) {
    const newSentence = text.replace(replacements[i][0], replacements[i][1]);
    const styledSentence = text.replace(replacements[i][0], '<b>' + replacements[i][1] + '</b>');
    newSentences.push(newSentence);
    styledSentences.push(styledSentence);
    promises.push(callPerspective(newSentence, lang, ['TOXICITY']));
  }

  const mostToxic = { string: '', score: Number.MIN_VALUE };
  const leastToxic = { string: '', score: Number.MAX_VALUE };
  await storeExtremes(promises, mostToxic, leastToxic, styledSentences);
  renderExtremes(container, loadingEl, leastToxic, mostToxic);
}

/** Finds the possible replacements of the words given. */
async function getAllReplacements(words, numResults) {
  const replacements = [];
  const wordsCalled = [];
  const datamuseCalls = [];
  for (let word of words) {
    for (let attribute of Object.values(DATAMUSE_ATTRIBUTES)) {
      wordsCalled.push(word);
      datamuseCalls.push(callDatamuse(word, attribute, numResults));
    }
  }
  await Promise.all(datamuseCalls).then(datamuseResponses => {
    for (let i = 0; i < datamuseResponses.length; i++) {
      for (let j = 0; j < datamuseResponses[i].length; j++) {
        replacements.push([wordsCalled[i], datamuseResponses[i][j].word]);
      }
    }
  });
  return replacements;
}

/** From an array of Perspective promises, stores the most extreme sentence variations in "mostToxic" & "leastToxic" */
async function storeExtremes(promises, mostToxic, leastToxic, styledSentences) {
  await Promise.all(promises).then(resolvedResponses => {
    for (let i = 0; i < resolvedResponses.length; i++) {
      const toxicityScore = resolvedResponses[i].attributeScores.TOXICITY.summaryScore.value;
      // Update the current extreme values if necessary
      if (toxicityScore > mostToxic.score) {
        mostToxic.score = toxicityScore;
        mostToxic.string = styledSentences[i];
      } else if (toxicityScore < leastToxic.score) {
        leastToxic.score = toxicityScore;
        leastToxic.string = styledSentences[i];
      }
    }
  });
}

/** Calculates the appropriate number of Datamuse results per word to get */
function getNumResults(numWords) {
  let numResults = MAX_DATAMUSE_RESULTS_PER_WORD;
  if (numResults * numWords > MAX_TOTAL_DATAMUSE_RESULTS) {
    numResults = Math.floor(MAX_TOTAL_DATAMUSE_RESULTS / numWords);
  }
  return numResults;
}

/** Renders the extreme variations of a sentence after they have been calculated */
function renderExtremes(container, loadingEl, leastToxic, mostToxic) {
  container.removeChild(loadingEl);
  container.appendChild(createAnyElement('p', 'Least toxic variation: ' + leastToxic.string + ' -> ' + decimalToPercentage(leastToxic.score)));
  container.appendChild(createAnyElement('p', 'Most toxic variation: ' + mostToxic.string + ' -> ' + decimalToPercentage(mostToxic.score)));
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
  const replacements = await callDatamuse(substringForReplacements, wordType, 5);
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

  const optionsRow = document.createElement('div');
  optionsRow.className = 'row';

  setUpWordTypeSelection(container, optionsRow, text, lang, substringForReplacements);
  
  // Set up extremes analysis button
  const extremesSection = document.createElement('div')
  extremesSection.className = 'col-6'; 
  const extremesButton = document.createElement('button');
  extremesButton.innerHTML = 'Get Extremes';
  extremesButton.className = 'btn btn-primary';
  extremesButton.onclick = function() { getExtremes(text, lang); };
  extremesSection.appendChild(extremesButton)
  optionsRow.appendChild(extremesSection);
}

function setUpWordTypeSelection(container, optionsRow, text, lang, substringForReplacements) {
  const wordTypeSection = document.createElement('div');
  wordTypeSection.className = 'col-6';
	
  // Set up radios for word type selection
  const radiosEl = document.createElement('div');
  radiosEl.appendChild(createAnyElement('p', 'Different type of word replacement?'));
  for (let attribute of Object.keys(DATAMUSE_ATTRIBUTES)) {
    radiosEl.appendChild(createIndividualRadio(attribute + '-radio', 'radio', DATAMUSE_ATTRIBUTES[attribute], 'form-check', attribute, 'datamuse-radios'));
  }
  wordTypeSection.appendChild(radiosEl);
  optionsRow.appendChild(wordTypeSection);
  container.appendChild(optionsRow);
  document.getElementsByName('datamuse-radios')[0].checked = true;

  // Set up submit button for word type selection
  const submitButton = document.createElement('button');
  submitButton.innerHTML = 'Submit';
  submitButton.className = 'btn btn-primary';
  submitButton.onclick = function() { getReplacements(text, lang, substringForReplacements); };
  wordTypeSection.appendChild(submitButton);
}

/** Gets the original toxicity score of the substring the user selected for replacements */
async function getOriginalToxicity(text, lang, container, loadingEl) {
  const response = await callPerspective(text, lang, ['TOXICITY']);
  if (typeof(response.attributeScores) === 'undefined') {
    container.removeChild(loadingEl);
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
async function callDatamuse(text, wordType, numResults) {
  words = text.replace(' ', '+');
  let response = await fetch('https://api.datamuse.com/words?' + wordType + '=' + words + '&max=' + numResults);
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
    let color = '#6B8E23'; // Green
    const score = responses[i].attributeScores['TOXICITY'].summaryScore.value;
    if (score >= 0.8) {
      color = '#DC143C'; // Red
    } else if (score >= 0.2) {
      color = '#ffd800'; // Yellow
    }
    data.addRow([replacements[i].word, score, color]);
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
    let color = '#6B8E23'; // Green
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
  // Highlight <li> element when its input is checked
  $('.checkbox-menu').on('change', "input[type='checkbox']", function() {
    $(this).closest('li').toggleClass('active', this.checked);
  });

  // Keep menu open when an option is selected or deselected
  $(document).on('click', '.allow-focus', function(e) {
    e.stopPropagation();
  });

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
    checkbox.type = 'checkbox';
    checkbox.value = attribute;
  
    const label = document.createElement('label');
    label.appendChild(checkbox);
    label.innerHTML += attribute;

    const list = document.createElement('li');
    list.className = 'active';
    list.appendChild(label);
  
    avaiableAttributesElement.appendChild(list);

    // Check the attribute's box; Ajax prevents doing this earlier
    list.children[0].children[0].checked = true;
  });
}

function loadAnalysisDropdown() {
  // Highlight an <li> element in analysis radio selection when its input is checked
  $('.checkbox-menu').on('change', "input[type='radio']", function() {
    $("input[name='analysisRadios']").closest('li').toggleClass('active', false);
    $(this).closest('li').toggleClass('active', this.checked);
  });
}

/** Shows or hides the advanced options for text analysis */
function toggleAdvancedOptions() {
  const toggleButton = document.getElementById('toggle-advanced-options-button');
  if (!toggleButton) {
    return;
  }
  const advancedOptionsEl = document.getElementById('advanced-options');
  if (!advancedOptionsEl) {
    return;
  }
  if (toggleButton.innerHTML === 'Advanced options') {
    advancedOptionsEl.style.display = 'block';
    toggleButton.innerHTML = 'Hide advanced options';
  } else {
    advancedOptionsEl.style.display = 'none';
    toggleButton.innerHTML = 'Advanced options';
  }
}
