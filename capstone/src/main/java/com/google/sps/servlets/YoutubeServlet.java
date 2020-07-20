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

/** Servlet that returns youtube api data. */
@WebServlet("/youtube_servlet")
public class YoutubeServlet extends HttpServlet {
  private static final String BASE_URL = "https://www.googleapis.com/youtube/v3/commentThreads?part=snippet%2Creplies";
  private static final String KEY = "API_KEY";
  private static final String NUM_RESULTS = "5";
  private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
  OkHttpClient client = new OkHttpClient();

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    String channelId = request.getParameter("channelId");
    String videoId = request.getParameter("videoId");
    String completeURL;
    if (channelId != null) {
      completeURL = BASE_URL + "&allThreadsRelatedToChannelId=" + channelId + "&maxResults=" + NUM_RESULTS + "&key=" + KEY;
    } else {
      completeURL = BASE_URL + "&videoId=" + videoId + "&maxResults=" + NUM_RESULTS + "&key=" + KEY;
    }
    String output = get(completeURL);
    response.setContentType("application/json");
    response.getWriter().println(output);  
  }
  
  /** Makes a GET request. */
  private String get(String url) throws IOException {
    Request request = new Request.Builder()
      .url(url)
      .build();
    try (Response response = client.newCall(request).execute()) {
      return response.body().string();
    }
  }
}
