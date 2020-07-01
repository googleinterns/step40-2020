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

attributeData = {
  "attributeScores": {
    "THREAT": {
      "spanScores": [
        {
          "begin": 0,
          "end": 4,
          "score": {
            "value": 0.18365456,
            "type": "PROBABILITY"
          }
        }
      ],
      "summaryScore": {
        "value": 0.18365456,
        "type": "PROBABILITY"
      }
    },
    "TOXICITY": {
      "spanScores": [
        {
          "begin": 0,
          "end": 4,
          "score": {
            "value": 0.96509165,
            "type": "PROBABILITY"
          }
        }
      ],
      "summaryScore": {
        "value": 0.96509165,
        "type": "PROBABILITY"
      }
    },
    "INSULT": {
      "spanScores": [
        {
          "begin": 0,
          "end": 4,
          "score": {
            "value": 0.60424614,
            "type": "PROBABILITY"
          }
        }
      ],
      "summaryScore": {
        "value": 0.60424614,
        "type": "PROBABILITY"
      }
    },
    "SEVERE_TOXICITY": {
      "spanScores": [
        {
          "begin": 0,
          "end": 4,
          "score": {
            "value": 0.7285898,
            "type": "PROBABILITY"
          }
        }
      ],
      "summaryScore": {
        "value": 0.7285898,
        "type": "PROBABILITY"
      }
    },
    "IDENTITY_ATTACK": {
      "spanScores": [
        {
          "begin": 0,
          "end": 4,
          "score": {
            "value": 0.13047843,
            "type": "PROBABILITY"
          }
        }
      ],
      "summaryScore": {
        "value": 0.13047843,
        "type": "PROBABILITY"
      }
    },
    "PROFANITY": {
      "spanScores": [
        {
          "begin": 0,
          "end": 4,
          "score": {
            "value": 0.9831821,
            "type": "PROBABILITY"
          }
        }
      ],
      "summaryScore": {
        "value": 0.9831821,
        "type": "PROBABILITY"
      }
    }
  },
  "languages": [
    "en"
  ],
  "detectedLanguages": [
    "en"
  ]
};

function loadChartsApi() {
  google.charts.load('current', {'packages':['corechart']});
  google.charts.setOnLoadCallback(drawBarChart); 
}

/** Draws a Google BarChart from a Perspective JSON. */
function drawBarChart() {
  const data = google.visualization.arrayToDataTable([[ {label: 'Attribute'}, {label: 'Score', type: 'number'}, {role: "style"}]]);

  Object.keys(attributeData.attributeScores).forEach((attribute) => {
    var color = '#6B8E23'; // Green
    const score = attributeData.attributeScores[attribute].summaryScore.value;
    if (score >= 0.8) {
      color = '#DC143C'; // Red
    } else if (score >= 0.2) {
      color = '#ffd800'; // Yellow
    }
    console.log(color); 
    data.addRow([attribute, score, color]);
  });

  data.sort({column: 1, desc: false});

  const options = {
    title: 'Perspective Feedback',
    bars: 'horizontal',
    height: 700,
    legend: { position: "none" },
    theme: 'material'
  };

  const chart = new google.visualization.BarChart(document.getElementById('chart-container'));
  chart.draw(data, options);
}
