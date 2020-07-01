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
import com.google.sps.data.PerspectiveInput;
import org.json.simple.JSONObject;    
import java.util.ArrayList;
import java.util.Arrays;

/** Servlet that returns Perspective scoring. */
@WebServlet("/call_perspective")
public class CallPerspectiveServlet extends HttpServlet {
  private static final String URL = "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=API_KEY";
  private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
  private static final ArrayList<String> ATTRIBUTES = new ArrayList<String>(Arrays.asList("TOXICITY", "PROFANITY", "THREAT", "INSULT", "IDENTITY_ATTACK", "SEVERE_TOXICITY"));

  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
    // Get the input
    String data = request.getReader().readLine();
    Gson gson = new Gson();		
    PerspectiveInput info = gson.fromJson(data, PerspectiveInput.class);  
    
    String text = info.getText();
    String lang = info.getLang();
		
    // Make the request to Perspective API
    OkHttpClient client = new OkHttpClient();
    String json = makePerspectiveJson(text, lang);
    String output = post(URL, json, client);
  
    // Return Perspective's results
    response.setContentType("application/json");
    response.getWriter().println(output);
  }

  /** Makes a POST request. */
  private String post(String url, String json, OkHttpClient client) throws IOException {
    RequestBody body = RequestBody.create(json, JSON);
    Request request = new Request.Builder().url(url).post(body).build();

    try (Response response = client.newCall(request).execute()) {
      return response.body().string();
    }
  }

  /** Builds the JSON for the body of the call to Perspective API. */
  private String makePerspectiveJson(String text, String lang) {
    JSONObject json = new JSONObject();  
    JSONObject commentValue = new JSONObject();
    JSONObject requestValue = new JSONObject();

    commentValue.put("text", text);
    for (String attribute : ATTRIBUTES) {
      requestValue.put(attribute, new JSONObject());
    }

    json.put("comment", commentValue);
    json.put("languages", lang);    
    json.put("requestedAttributes", requestValue);    
    return json.toString();
  } 
}
