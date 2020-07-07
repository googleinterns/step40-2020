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

package com.google.sps.data;

import java.io.IOException;
import okhttp3.OkHttpClient;

/** Mock Perspective caller that returns dummy output */
public class MockPerspCaller implements ApiCaller {
  public String post(String url, String json, OkHttpClient client) throws IOException {
    return "{\"attributeScores\":{" +
      "\"INSULT\":{\"spanScores\":[{\"begin\":0,\"end\":21,\"score\":{\"value\":0.7024426,\"type\":\"PROBABILITY\"}}],\"summaryScore\":{\"value\":0.7024426,\"type\":\"PROBABILITY\"}}," +
      "\"THREAT\":{\"spanScores\":[{\"begin\":0,\"end\":21,\"score\":{\"value\":0.11023958,\"type\":\"PROBABILITY\"}}],\"summaryScore\":{\"value\":0.11023958,\"type\":\"PROBABILITY\"}}," +
      "\"PROFANITY\":{\"spanScores\":[{\"begin\":0,\"end\":21,\"score\":{\"value\":0.25487214,\"type\":\"PROBABILITY\"}}],\"summaryScore\":{\"value\":0.25487214,\"type\":\"PROBABILITY\"}}," +
      "\"TOXICITY\":{\"spanScores\":[{\"begin\":0,\"end\":21,\"score\":{\"value\":0.6079781,\"type\":\"PROBABILITY\"}}],\"summaryScore\":{\"value\":0.6079781,\"type\":\"PROBABILITY\"}}," +
      "\"IDENTITY_ATTACK\":{\"spanScores\":[{\"begin\":0,\"end\":21,\"score\":{\"value\":0.10474427,\"type\":\"PROBABILITY\"}}],\"summaryScore\":{\"value\":0.10474427,\"type\":\"PROBABILITY\"}}," +
      "\"SEVERE_TOXICITY\":{\"spanScores\":[{\"begin\":0,\"end\":21,\"score\":{\"value\":0.16598417,\"type\":\"PROBABILITY\"}}],\"summaryScore\":{\"value\":0.16598417,\"type\":\"PROBABILITY\"}}}," +
      "\"languages\":[\"en\"],\"detectedLanguages\":[\"en\"]}";
  }
}

/**
{"attributeScores":{
      "INSULT":{"spanScores":[{"begin":0,"end":21,"score":{"value":0.7024426,"type":"PROBABILITY"}}],"summaryScore":{"value":0.7024426,"type":"PROBABILITY"}},
      "THREAT":{"spanScores":[{"begin":0,"end":21,"score":{"value":0.11023958,"type":"PROBABILITY"}}],"summaryScore":{"value":0.11023958,"type":"PROBABILITY"}},
      "PROFANITY":{"spanScores":[{"begin":0,"end":21,"score":{"value":0.25487214,"type":"PROBABILITY"}}],"summaryScore":{"value":0.25487214,"type":"PROBABILITY"}},
      "TOXICITY":{"spanScores":[{"begin":0,"end":21,"score":{"value":0.6079781,"type":"PROBABILITY"}}],"summaryScore":{"value":0.6079781,"type":"PROBABILITY"}},
      "IDENTITY_ATTACK":{"spanScores":[{"begin":0,"end":21,"score":{"value":0.10474427,"type":"PROBABILITY"}}],"summaryScore":{"value":0.10474427,"type":"PROBABILITY"}},
      "SEVERE_TOXICITY":{"spanScores":[{"begin":0,"end":21,"score":{"value":0.16598417,"type":"PROBABILITY"}}],"summaryScore":{"value":0.16598417,"type":"PROBABILITY"}}},
      "languages":["en"],"detectedLanguages":["en"]};
*/