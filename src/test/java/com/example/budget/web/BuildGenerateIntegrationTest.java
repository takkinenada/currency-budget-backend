package com.example.budget.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class BuildGenerateIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void generateBuildReturnsStoreAndAffiliateFieldsAndAffiliateRedirectWorks() throws Exception {
        String body = """
                {
                  "budget": 50000,
                  "currency": "UAH",
                  "brands": []
                }
                """;

        MvcResult mvcResult = mockMvc.perform(post("/api/builds/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.builds").isArray())
                .andExpect(jsonPath("$.builds[0].parts[0].componentId").isNumber())
                .andExpect(jsonPath("$.builds[0].parts[0].storeName").isNotEmpty())
                .andExpect(jsonPath("$.builds[0].parts[0].inStock").value(true))
                .andExpect(jsonPath("$.builds[0].parts[0].affiliateUrl").isNotEmpty())
                .andReturn();

        JsonNode root = objectMapper.readTree(mvcResult.getResponse().getContentAsString());
        JsonNode firstPart = root.path("builds").get(0).path("parts").get(0);
        long componentId = firstPart.path("componentId").asLong();
        String affiliateUrl = firstPart.path("affiliateUrl").asText();

        assertThat(affiliateUrl).isEqualTo("/api/affiliate/go/" + componentId);

        // Перевіряємо, що перехід за згенерованим шляхом віддає 302 редірект з UTM-мітками
        MvcResult redirectResult = mockMvc.perform(get(affiliateUrl))
                .andExpect(status().isFound())
                .andReturn();

        String location = redirectResult.getResponse().getHeader("Location");
        assertThat(location).contains("utm_source=");
        assertThat(location).contains("partner=");
    }
}