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

package com.google.sps;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;
import org.mockito.Mockito;
import com.google.sps.servlets.YoutubeKeywordServlet;
import com.google.sps.servlets.YoutubeServlet;
import com.google.sps.servlets.YoutubeTrendingServlet;
import com.google.sps.servlets.YoutubeUsernameServlet;
import com.google.sps.data.ApiCaller;
import com.google.sps.data.MockYoutubeResponse;
import com.google.sps.data.MockYoutubeResponseBadKey;
import com.google.sps.data.MockYoutubeResponseNullInput;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;

/** Tests the various youtube servlet classes*/
@RunWith(JUnit4.class)
public final class YoutubeServletsTest {
  private StringWriter stringWriter;
  private PrintWriter writer;
  private HttpServletRequest request;
  private HttpServletResponse response;

  @Before
  public void setUp() {
    this.stringWriter = new StringWriter();
    this.writer = new PrintWriter(stringWriter);
    this.request = Mockito.mock(HttpServletRequest.class);
    this.response = Mockito.mock(HttpServletResponse.class);
  }

  // Tests for YoutubeServlet
  @Test
  public void YoutubeServletCall() throws IOException{
    ApiCaller mock = new MockYoutubeResponse();
    YoutubeServlet youtubeServlet = new YoutubeServlet(mock);
    Mockito.when(response.getWriter()).thenReturn(writer);
    youtubeServlet.doPost(request, response);
    Assert.assertTrue(stringWriter.toString().contains("{\"items\":[{\"snippet\":{\"topLevelComment\""));
  }

  @Test
  public void YoutubeServletCallBadKey() throws IOException{
    ApiCaller mock = new MockYoutubeResponseBadKey();
    YoutubeServlet youtubeServlet = new YoutubeServlet(mock);
    Mockito.when(response.getWriter()).thenReturn(writer);
    youtubeServlet.doPost(request, response);
    Assert.assertTrue(stringWriter.toString().contains("{\"error\":{\"code\":400,\""));
  }

  @Test
  public void YoutubeServletCallNullInput() throws IOException{
    ApiCaller mock = new MockYoutubeResponseNullInput();
    YoutubeServlet youtubeServlet = new YoutubeServlet(mock);
    Mockito.when(response.getWriter()).thenReturn(writer);
    youtubeServlet.doPost(request, response);
    Assert.assertTrue(stringWriter.toString().contains("{\"error\":{\"code\":404,\""));
  }

  // Tests for YoutubeKeywordServlet
  @Test
  public void YoutubeKeywordServletCall() throws IOException{
    ApiCaller mock = new MockYoutubeResponse();
    YoutubeKeywordServlet youtubeKeywordServlet = new YoutubeKeywordServlet(mock);
    Mockito.when(response.getWriter()).thenReturn(writer);
    youtubeKeywordServlet.doPost(request, response);
    Assert.assertTrue(stringWriter.toString().contains("{\"items\":[{\"snippet\":{\"topLevelComment\""));
  }

  @Test
  public void YoutubeKeywordServletCallBadKey() throws IOException{
    ApiCaller mock = new MockYoutubeResponseBadKey();
    YoutubeKeywordServlet youtubeKeywordServlet = new YoutubeKeywordServlet(mock);
    Mockito.when(response.getWriter()).thenReturn(writer);
    youtubeKeywordServlet.doPost(request, response);
    Assert.assertTrue(stringWriter.toString().contains("{\"error\":{\"code\":400,\""));
  }

  @Test
  public void YoutubeKeywordServletCallNullInput() throws IOException{
    ApiCaller mock = new MockYoutubeResponseNullInput();
    YoutubeKeywordServlet youtubeKeywordServlet = new YoutubeKeywordServlet(mock);
    Mockito.when(response.getWriter()).thenReturn(writer);
    youtubeKeywordServlet.doPost(request, response);
    Assert.assertTrue(stringWriter.toString().contains("{\"error\":{\"code\":404,\""));
  }

  // Tests for YoutubeTrendingServlet
  @Test
  public void YoutubeTrendingServletCall() throws IOException{
    ApiCaller mock = new MockYoutubeResponse();
    YoutubeTrendingServlet youtubeTrendingServlet = new YoutubeTrendingServlet(mock);
    Mockito.when(response.getWriter()).thenReturn(writer);
    youtubeTrendingServlet.doPost(request, response);
    Assert.assertTrue(stringWriter.toString().contains("{\"items\":[{\"snippet\":{\"topLevelComment\""));
  }

  @Test
  public void YoutubeTrendingServletCallBadKey() throws IOException{
    ApiCaller mock = new MockYoutubeResponseBadKey();
    YoutubeTrendingServlet youtubeTrendingServlet = new YoutubeTrendingServlet(mock);
    Mockito.when(response.getWriter()).thenReturn(writer);
    youtubeTrendingServlet.doPost(request, response);
    Assert.assertTrue(stringWriter.toString().contains("{\"error\":{\"code\":400,\""));
  }

  @Test
  public void YoutubeTrendingServletCallNullInput() throws IOException{
    ApiCaller mock = new MockYoutubeResponseNullInput();
    YoutubeTrendingServlet youtubeTrendingServlet = new YoutubeTrendingServlet(mock);
    Mockito.when(response.getWriter()).thenReturn(writer);
    youtubeTrendingServlet.doPost(request, response);
    Assert.assertTrue(stringWriter.toString().contains("{\"error\":{\"code\":404,\""));
  }
  // Tests for YoutubeUsernameServlet
  @Test
  public void YoutubeUsernameServletCall() throws IOException{
    ApiCaller mock = new MockYoutubeResponse();
    YoutubeUsernameServlet youtubeUsernameServlet = new YoutubeUsernameServlet(mock);
    Mockito.when(response.getWriter()).thenReturn(writer);
    youtubeUsernameServlet.doPost(request, response);
    Assert.assertTrue(stringWriter.toString().contains("{\"items\":[{\"snippet\":{\"topLevelComment\""));
  }

  @Test
  public void YoutubeUsernameServletCallBadKey() throws IOException{
    ApiCaller mock = new MockYoutubeResponseBadKey();
    YoutubeUsernameServlet youtubeUsernameServlet = new YoutubeUsernameServlet(mock);
    Mockito.when(response.getWriter()).thenReturn(writer);
    youtubeUsernameServlet.doPost(request, response);
    Assert.assertTrue(stringWriter.toString().contains("{\"error\":{\"code\":400,\""));
  }

  @Test
  public void YoutubeUsernameServletCallNullInput() throws IOException{
    ApiCaller mock = new MockYoutubeResponseNullInput();
    YoutubeUsernameServlet youtubeUsernameServlet = new YoutubeUsernameServlet(mock);
    Mockito.when(response.getWriter()).thenReturn(writer);
    youtubeUsernameServlet.doPost(request, response);
    Assert.assertTrue(stringWriter.toString().contains("{\"error\":{\"code\":404,\""));
  }
}
