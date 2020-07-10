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

/** Calls youtube servlet and passes output to perspctive */
async function callYoutube() {
  const channelId = document.getElementById('channelIdForAnalysis').value;
  if (!channelId) {
    return;
  }
  var response;
  if (channelId[0]=="U" && channelId[1]=="C") {
    response = await fetch('/youtube_servlet?channelId=' + channelId,);
  } else {
    const converterResponse = await fetch('/username_servlet?channelId=' + channelId,)
    const converterResponseJson = await converterResponse.json();
    const convertedUserName = converterResponseJson.items[0].id;
    response = await fetch('/youtube_servlet?channelId=' + convertedUserName,);
  }
  inputCommentsToPerspective(response);
}

/** Calls perspective to analyze comments */
async function inputCommentsToPerspective(response) {
  const comments = await response.json();
  const commentListElement = document.getElementById('comment-list');
  commentListElement.innerHTML = '';
  const requestedAttributes = getRequestedAttributes();
  if (!requestedAttributes) {
      return;
  }
  const attributeAverages = new Map();
  for (const attribute of requestedAttributes) {
    const attributeScores = [];
    for (const item in comments.items) {
      const perspectiveScore = await callPerspective(comments.items[item].snippet.topLevelComment.snippet.textOriginal, "en", [attribute]);
      attributeScores.push(perspectiveScore);
    }
    attributeScoresSum = arrSum(attributeScores);
    attributeScoresAvg = attributeScoresSum / comments.items.length;
    attributeAverages.set(attribute, attributeScoresAvg)
    commentListElement.append("AVERAGE " + attribute + " : " + attributeScoresAvg);
    commentListElement.appendChild(document.createElement('br'));
  }
  loadChartsApi(attributeAverages);
}

/** Returns the user's input */
function getRequestedAttributes() {
  const attributes = document.getElementById("available-attributes").getElementsByTagName('input');
  const requestedAttributes = [];
  for (const attribute of attributes) {
    if (attribute.checked == true) {
      requestedAttributes.push(attribute.value);	
    }	
  }
  return requestedAttributes;
}

/** Calls the perspective API */
async function callPerspective(text, lang, requestedAttribute) {
  const response = await fetch('/call_perspective', {
    method: 'POST',
    headers: {'Content-Type': 'application/json',},
    body: JSON.stringify({text: text, lang: lang, requestedAttributes: requestedAttribute})});
  const toxicityData = await response.json();
  return toxicityData.attributeScores[requestedAttribute].summaryScore.value;
}

/** Loads the Google Charts API */
function loadChartsApi(toxicityData) {
  google.charts.load('current', {'packages':['corechart']});
  google.charts.setOnLoadCallback(function() {drawBarChart(toxicityData);}); 
}

/** Draws a Google BarChart from a map. */
function drawBarChart(toxicityData) {
  document.getElementById('chart-container').innerHTML = '';
  const data = google.visualization.arrayToDataTable([[{label: 'Attribute'}, {label: 'Score', type: 'number'}, {role: "style"}]]);
  for (const [attribute, attributeScoresAvg] of toxicityData) {
    var color = '#6B8E23'; // Green
    const score = attributeScoresAvg;
    if (score >= 0.8) {
      color = '#DC143C'; // Red
    } else if (score >= 0.2) {
      color = '#ffd800'; // Yellow
    }
    data.addRow([attribute, score, color]);
  }
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
    avaiableAttributesElement.appendChild(label);
    avaiableAttributesElement.appendChild (document.createTextNode (" "));
  });
}

/** Returns the sum of all elements in an array */
arrSum = function(arr) {
  return arr.reduce(function(a, b) {
    return a + b
  }, 0);
}
