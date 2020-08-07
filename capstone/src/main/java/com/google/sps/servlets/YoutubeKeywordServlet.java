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
import org.json.simple.JSONObject;    
import java.util.ArrayList;
import java.util.Arrays;
import com.google.sps.data.ApiCaller;
import com.google.sps.data.PostRequest; 
import com.google.sps.data.GetRequest;


/** Servlet that returns youtube video data based on a keyword. */
@WebServlet("/keyword_search_servlet")
public class YoutubeKeywordServlet extends HttpServlet {
  private static final String BASE_URL = "https://www.googleapis.com/youtube/v3/search?part=snippet";
  private static final String KEY = "API_KEY";
  private static final String NUM_RESULTS = "5";
  private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
  OkHttpClient client = new OkHttpClient();
  private ApiCaller apiCaller;

  public YoutubeKeywordServlet() {
    super();
    this.apiCaller = new PostRequest();
  }

  public YoutubeKeywordServlet(ApiCaller apiCaller) {
    super();
    this.apiCaller = apiCaller;
  }

  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
    if (request.getReader() != null) {
      String postRequestBodyData = request.getReader().readLine().trim();
      String completeUrl = BASE_URL + "&maxResults=" + NUM_RESULTS + "&q=" + postRequestBodyData + "&key=" + KEY;
      String output = GetRequest.get(completeUrl, client);
      response.setContentType("application/json");
      response.getWriter().println(output); 
    } else {
      String output = apiCaller.post("url", "json", client);
      response.setContentType("application/json");
      response.getWriter().println(output);
    } 
  }
}
