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

const YOUTUBE_CATEGORIES = {
  'Autos&Vehicles': 2,
  'Comedy': 23,
  'Entertainment': 24,
  'Film&Animation': 1,
  'Gaming': 20,
  'How-to&Style' : 26,
  'Music': 10,
  'Pets&Animals': 15,
  'Science&Technology': 28,
  'Sports' : 17,
};

/** Calls youtube servlet and passes output to perspctive */
async function callYoutube() {
  document.getElementById('search-type').innerHTML = ""
  const channelId = document.getElementById('channelIdForAnalysis').value.replace(/ /g, '');
  if (!channelId) {
    return;
  }
  /** Checks if input is a category, if so directs input to be handled by get trending*/
  if (YOUTUBE_CATEGORIES[channelId] != undefined) {
    document.getElementById('search-type').innerHTML ="Category Search";
    getTrending(YOUTUBE_CATEGORIES[channelId]);
    return;
  }
  /** Checks if input follows channel ID format, if not attempts to convert it to channel ID*/
  var response;
  if (channelId[0] == "U" && channelId[1] == "C" && channelId.length == 24 && isLetter(channelId[channelId.length-1])) {
    response = await fetch('/youtube_servlet?channelId=' + channelId,)
    response = await response.json();
    if (response.hasOwnProperty('error')) {
      alert("Invalid Channel ID");
      inputCommentsToPerspective([]);
      return;
    }
    document.getElementById('search-type').innerHTML ="Channel ID Search";
  } else {
    const usernameConverterResponse = await fetch('/username_servlet?channelId=' + channelId,)
    const usernameConverterResponseJson = await usernameConverterResponse.json();
    if (usernameConverterResponseJson.pageInfo.totalResults == 0) {
      alert("Username Not found, Please Input Channel ID");
      inputCommentsToPerspective([]);
      return;
    }
    document.getElementById('search-type').innerHTML ="Username Search";
    const convertedUserName = usernameConverterResponseJson.items[0].id;
    response = await fetch('/youtube_servlet?channelId=' + convertedUserName,)
    response = await response.json();
  }
  inputCommentsToPerspective([response]);
}

/** Calls perspective to analyze an array of comment JSON's */
async function inputCommentsToPerspective(commentsList) {
  const langElement = document.getElementById('languageForAnalysis');
  if (!langElement) {
    return;
  }
  const commentListElement = document.getElementById('comment-list');
  commentListElement.innerHTML = '';
  const requestedAttributes = getRequestedAttributes();
  if (!requestedAttributes) {
      return;
  }
  const attributeTotals = new Map();
  for (const comments in commentsList) {
    const attributeScores = [];
    for (const item in commentsList[comments].items) {
      const perspectiveScore = await callPerspective(commentsList[comments].items[item].snippet.topLevelComment.snippet.textOriginal, langElement.value, requestedAttributes);
      attributeScores.push(perspectiveScore);
    }
    for (var i = 0; i < requestedAttributes.length; i++) {
      for (var j = 0; j < attributeScores.length; j++) {
        if (attributeTotals.has(requestedAttributes[i])) {
          attributeTotals.set(requestedAttributes[i], attributeTotals.get(requestedAttributes[i]) + attributeScores[j].attributeScores[requestedAttributes[i]].summaryScore.value);
        } else {
          attributeTotals.set(requestedAttributes[i], attributeScores[j].attributeScores[requestedAttributes[i]].summaryScore.value);
        }
      }
    }
  }
  const attributeAverages = new Map();
  for (const [attribute, attributeScoresTotal] of attributeTotals) {
    attributeAverages.set(attribute,attributeScoresTotal / ((commentsList[0].items.length)*commentsList.length));
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
async function callPerspective(text, lang, requestedAttributes) {
  const response = await fetch('/call_perspective', {
    method: 'POST',
    headers: {'Content-Type': 'application/json',},
    body: JSON.stringify({text: text, lang: lang, requestedAttributes: requestedAttributes})});
  const toxicityData = await response.json();
  return toxicityData;
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
    avaiableAttributesElement.appendChild(document.createTextNode (" "));
  });
}

/** Checks if a character is a letter */
function isLetter(character) {
  if ((character.charCodeAt() >= 65 && character.charCodeAt() <= 90) || (character.charCodeAt() >= 97 && character.charCodeAt() <= 122)) {
    return true;
  } else {
    return false;
  }
}

async function getTrending(categoryId) {
  trendingResponse = await fetch('/trending_servlet?videoCategoryId=' + categoryId,)
  trendingResponseJson = await trendingResponse.json();
  const trendingVideoIds = [];
  for (const item in trendingResponseJson.items) {
    const videoId = trendingResponseJson.items[item].id;
    trendingVideoIds.push(videoId);
  }
  const commentsList = []
  for (const id in trendingVideoIds) {
    videoCommentList = await fetch('/youtube_servlet?videoID=' + trendingVideoIds[id],)
    videoCommentListJson = await videoCommentList.json();
    commentsList.push(videoCommentListJson);
  }
  inputCommentsToPerspective(commentsList);
}

function enableTextInput(button) {
  if (button.checked) { 
    document.getElementById('channelIdForAnalysis').value = button.id;
    document.getElementById('channelIdForAnalysis').disabled = true;   
  }
}

function disableTextInput(button) {
  if (button.checked) { 
    document.getElementById('channelIdForAnalysis').value = "";
    document.getElementById('channelIdForAnalysis').disabled = false;
  }
}

/** Creates radio buttons to allow teh user to select between various categories*/
function showCategories() {
  /** Creates button to enable manual input*/
  const radiobox = document.createElement('input');
  radiobox.type = 'radio';
  radiobox.id = 'manualInput';
  radiobox.value = 'manualInput';
  radiobox.name = 'same';
  radiobox.checked  = true;
  const label = document.createElement('label');
  label.htmlFor = 'manualInput';
  const description = document.createTextNode('ID/Username');
  label.appendChild(description);
  radiobox.onclick = function() {
    disableTextInput(this);   
  }
  const container = document.getElementById('category-container');
  container.appendChild(radiobox);
  container.appendChild(label);
  container.appendChild(document.createTextNode (" "));
  container.appendChild(document.createElement("br"));
  for (const category in YOUTUBE_CATEGORIES ) {
    const radiobox = document.createElement('input');
    radiobox.type = 'radio';
    radiobox.id = category;
    radiobox.value = category;
    radiobox.name = 'same';
    const label = document.createElement('label')
    label.htmlFor = category;
    const description = document.createTextNode(category);
    label.appendChild(description);
    radiobox.onclick = function() {
      enableTextInput(this);   
    }
    const container = document.getElementById('category-container');
    container.appendChild(radiobox);
    container.appendChild(label);
    container.appendChild(document.createTextNode (" "));
  }
}
