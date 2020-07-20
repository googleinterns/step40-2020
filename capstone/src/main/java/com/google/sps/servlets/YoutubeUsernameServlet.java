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
import java.io.UnsupportedEncodingException; 
import java.net.MalformedURLException; 
import java.net.URL; 
import java.net.URLEncoder; 

/** Servlet that converts a youtube username to a channelID. */
@WebServlet("youtube_username_servlet")
public class YoutubeUsernameServlet extends HttpServlet {
  private static final String URL = " https://www.googleapis.com/youtube/v3/channels?key=";
  private static final String KEY = "API_KEY";
  private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
  OkHttpClient client = new OkHttpClient();

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    String userName = request.getParameter("channelId");
    String ecodedUserName = URLEncoder.encode(userName, "UTF-8");
    String url = URL + KEY + "&forUsername=" + ecodedUserName + "&part=id";
    String output = get(url);
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