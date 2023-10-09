<script setup>
import { ref, computed } from 'vue';

const link = ref("https://bing.com")
const linkready = ref(0)
const textareaContent = ref("")
const isfailed = ref(0)

const validUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

const copyToclipboard = computed(async () => {
  try {
    await navigator.clipboard.writeText(link.value);
    alert("已成功复制到剪贴板");
  } catch (error) {
    console.error("复制到剪贴板失败", error);
  }
})

const registerNewLink = computed(() => {
  if (!validUrl(textareaContent.value)) {
    alert("你输入的长网址格式不正确！请检查并重试！");
    return false;
  }
  const requestOptions = {
    method: 'POST', // 使用POST方法
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // 可以添加其他请求头，如授权令牌等
    },
    body: "rawpath=" + textareaContent.value, // 将要发送的数据转换为JSON字符串
  };

  // 发起POST请求
  fetch('/addpath/ensure', requestOptions)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json(); // 将响应数据解析为JSON格式
    })
    .then(data => {
      // 在这里可以处理JSON数据
      console.log(data);
      link.value = window.location.href + data.link.slice(1);
      linkready.value = 1;
      isfailed.value = 0;
    })
    .catch(error => {
      // 处理网络请求或JSON解析错误
      console.error('There was a problem with the fetch operation:', error);
      isfailed.value = 1;
      linkready.value = 0;
    });
})
</script>

<template>
  <div class="mainbox">
    <h2 class="content">请输入你要生成短网址的原始链接</h2>
    <div class="centered">
      <textarea id="oldlink" type="text" placeholder="请输入长网址..." v-model="textareaContent"></textarea>

    </div>
    <div class="centered">
      <button class="btn" v-on:click="registerNewLink">立即生成</button>
    </div>
    <div class="centered">
      <div class="link" v-if="linkready">
        生成成功，链接为：<br> <a v-bind:href="link">{{ link }}</a><br> <button v-on:click="copyToclipboard">复制</button>
        <br>默认有效
        24
        hour
      </div>
      <div class="fail" v-if="isfailed">
        生成失败！请重试！
      </div>
    </div>
  </div>
</template>

<style scoped></style>
