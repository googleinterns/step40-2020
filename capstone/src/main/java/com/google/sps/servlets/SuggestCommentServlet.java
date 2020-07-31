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

package com.google.sps.servlets;

import java.io.IOException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import java.io.BufferedReader;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.sps.data.FeedbackInput;
import com.google.sps.data.ApiCaller;
import com.google.sps.data.PerspectiveCaller;
import org.json.simple.JSONObject;    
import org.json.simple.JSONArray;  
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Collection;

/** Servlet that suggests a difference score for Perspective. */
@WebServlet("/suggest_perspective")
public class SuggestCommentServlet extends HttpServlet {
  private static final String URL = "https://commentanalyzer.googleapis.com/v1alpha1/comments:suggestscore?key=API_KEY";
  private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
  private ApiCaller apiCaller;

  public SuggestCommentServlet() {
    super();
    this.apiCaller = new PerspectiveCaller();
  }

  public SuggestCommentServlet(ApiCaller apiCaller) {
    super();
    this.apiCaller = apiCaller;
  } 

  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
    // Get the input
    FeedbackInput info = new FeedbackInput("", "", new String[0], new String[0]);
    if (request.getReader() != null) {
      String data = request.getReader().readLine();
      Gson gson = new Gson();
      info = gson.fromJson(data, FeedbackInput.class);
    }
    if (info == null) {
      response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
      return;
    }

    String text = info.getText();
    String lang = info.getLang();
    HashMap<String, String> feedback = info.getFeedback();
    
    // Make the request to Perspective API
    OkHttpClient client = new OkHttpClient();
    String json = makePerspectiveJson(text, lang, feedback);
    String output = apiCaller.post(URL, json, client);
  
    // Return Perspective's results
    response.setContentType("application/json");
    response.getWriter().println(output);
  }
 
 
  /** 
   * Builds the JSON for the body of the call to Perspective API. 
   * It follows the form below   
   * { 
   *  "comment": { "text": ____ } , 
   *  "languages": ____ ,
   *  "attributeScores": {  ____: "summaryScore": {"value": ____ }, ... },
   * }
   */
  private String makePerspectiveJson(String text, String lang, HashMap<String, String> feedback) {
    JSONObject json = new JSONObject();  
    JSONObject commentValue = new JSONObject();
    JSONObject attributesValue = new JSONObject();

    commentValue.put("text", text);
    for (String suggestion : feedback.keySet()) {
      JSONObject value = new JSONObject();
      value.put("value", feedback.get(suggestion));
      JSONObject summaryScoreValue = new JSONObject();
      summaryScoreValue.put("summaryScore", value);
      attributesValue.put(suggestion, summaryScoreValue);
    }

    json.put("comment", commentValue);
    json.put("languages", lang);    
    json.put("attributeScores", attributesValue);    
    return json.toString();
  }
}
