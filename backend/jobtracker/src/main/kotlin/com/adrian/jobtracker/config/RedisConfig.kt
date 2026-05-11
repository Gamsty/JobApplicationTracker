package com.adrian.jobtracker.config

import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.cache.Cache
import org.springframework.cache.annotation.CachingConfigurer
import org.springframework.cache.annotation.EnableCaching
import org.springframework.cache.interceptor.CacheErrorHandler
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.redis.cache.RedisCacheConfiguration
import org.springframework.data.redis.connection.RedisConnectionFactory
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer
import org.springframework.data.redis.serializer.RedisSerializationContext
import java.time.Duration

// Configures Spring Cache + Redis to:
//   - Use JSON serialization instead of JDK serialization. JDK serialization requires every
//     cached class to implement Serializable, which would force invasive changes on existing
//     DTOs. JSON works on any Kotlin data class and is also readable in `redis-cli` for debugging.
//   - Set a 5-min default TTL so stale data is bounded even if a @CacheEvict is missed.
//
// Cache eviction on writes is handled per-service via @CacheEvict annotations on the relevant
// CRUD methods. The keys include the current user's ID so each user's cache is isolated.
@Configuration
@EnableCaching
class RedisConfig : CachingConfigurer {

    private val log = LoggerFactory.getLogger(RedisConfig::class.java)

    // The cache is an optimisation, not a hard dependency. If Redis is unreachable or returns
    // an error, log it and let the actual method run against the DB — better than turning every
    // Redis hiccup into a 500 response. Application Insights will surface the underlying Redis
    // failures separately as dependency errors, so we don't lose visibility.
    override fun errorHandler(): CacheErrorHandler = object : CacheErrorHandler {
        override fun handleCacheGetError(ex: RuntimeException, cache: Cache, key: Any) {
            log.warn("Cache get failed for ${cache.name}/$key: ${ex.message}")
        }
        override fun handleCachePutError(ex: RuntimeException, cache: Cache, key: Any, value: Any?) {
            log.warn("Cache put failed for ${cache.name}/$key: ${ex.message}")
        }
        override fun handleCacheEvictError(ex: RuntimeException, cache: Cache, key: Any) {
            log.warn("Cache evict failed for ${cache.name}/$key: ${ex.message}")
        }
        override fun handleCacheClearError(ex: RuntimeException, cache: Cache) {
            log.warn("Cache clear failed for ${cache.name}: ${ex.message}")
        }
    }


    @Bean
    fun cacheConfiguration(): RedisCacheConfiguration {
        // Reuse Spring's default ObjectMapper so Kotlin types and JavaTime (LocalDateTime in DTOs)
        // serialize consistently with the rest of the app's HTTP responses.
        val serializer = GenericJackson2JsonRedisSerializer(ObjectMapper().findAndRegisterModules())

        return RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(5))
            .disableCachingNullValues()
            .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(serializer))
    }

    // Plain StringRedisTemplate for the RateLimitFilter — uses INCR + EXPIRE keys, no objects involved.
    @Bean
    fun stringRedisTemplate(connectionFactory: RedisConnectionFactory): StringRedisTemplate {
        return StringRedisTemplate(connectionFactory)
    }
}
