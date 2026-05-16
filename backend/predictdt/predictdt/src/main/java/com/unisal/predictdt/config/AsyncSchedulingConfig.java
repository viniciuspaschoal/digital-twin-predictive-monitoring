package com.unisal.predictdt.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;


/* Isso habilita:
 * @Scheduled -> rodar tarefa de tempos em tempos
 * @Async     -> rodar tarefa em segundo plano depois
 * */

@Configuration
@EnableAsync
@EnableScheduling
public class AsyncSchedulingConfig {
}
