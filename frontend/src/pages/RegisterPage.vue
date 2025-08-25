<template>
  <q-page class="flex flex-center">
    <q-form @submit.prevent="onSubmit" class="q-gutter-md" style="width: 300px">
      <q-input v-model="email" type="email" label="Email" required />
      <q-input v-model="name" label="Name" required />
      <q-input v-model="password" type="password" label="Password" required />
      <div class="row justify-end">
        <q-btn label="Register" type="submit" color="primary" />
      </div>
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';

const email = ref('');
const name = ref('');
const password = ref('');
const auth = useAuthStore();
const router = useRouter();

async function onSubmit() {
  auth.register(email.value, name.value, password.value);
  await router.push('/');
}
</script>
