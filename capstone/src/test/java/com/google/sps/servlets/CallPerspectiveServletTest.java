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
import com.google.sps.servlets.CallPerspectiveServlet;
import com.google.sps.data.ApiCaller;
import com.google.sps.data.MockPerspCaller;
import com.google.sps.data.MockPerspCallerBadKey;
import com.google.sps.data.MockPerspCallerNullInput;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;

/** Test the CallPerspectiveServlet class*/
@RunWith(JUnit4.class)
public final class CallPerspectiveServletTest {
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

  @Test
  public void PerspectiveCall() throws IOException{
    ApiCaller mock = new MockPerspCaller();
    CallPerspectiveServlet callPerspectiveServlet = new CallPerspectiveServlet(mock);

    Mockito.when(response.getWriter()).thenReturn(writer);
    callPerspectiveServlet.doPost(request, response);

    Assert.assertTrue(stringWriter.toString().contains("{\"attributeScores\":{"));
  }

  @Test
  public void PerspectiveCallWithBadKey() throws IOException{
    ApiCaller mock = new MockPerspCallerBadKey();
    CallPerspectiveServlet callPerspectiveServlet = new CallPerspectiveServlet(mock);

    Mockito.when(response.getWriter()).thenReturn(writer);
    callPerspectiveServlet.doPost(request, response);

    Assert.assertTrue(stringWriter.toString().contains("API key not valid."));
  }

  @Test
  public void PerspectiveCallWithNullInput() throws IOException{
    ApiCaller mock = new MockPerspCallerNullInput();
    CallPerspectiveServlet callPerspectiveServlet = new CallPerspectiveServlet(mock);

    Mockito.when(response.getWriter()).thenReturn(writer);
    callPerspectiveServlet.doPost(request, response);

    Assert.assertTrue(stringWriter.toString().contains("Comment must be non-empty."));
  }
}
