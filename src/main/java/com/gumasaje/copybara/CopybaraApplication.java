package com.gumasaje.copybara;

import com.gumasaje.copybara.analysis.service.GeminiProperties;
import com.gumasaje.copybara.common.config.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({JwtProperties.class, GeminiProperties.class})
public class CopybaraApplication {

    public static void main(String[] args) {
        SpringApplication.run(CopybaraApplication.class, args);
    }

}
