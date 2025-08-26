<template>
  <q-form @submit.prevent="onSubmit" class="q-gutter-md" style="width: 300px">
    <q-input v-model="email" type="email" label="Email" required />
    <q-input v-if="mode === 'register'" v-model="name" label="Name" required />
    <q-input v-model="password" type="password" label="Password" required />
    <div class="row justify-end">
      <q-btn :label="buttonLabel" type="submit" color="primary" />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';

interface Props {
  mode: 'login' | 'register';
}

const props = defineProps<Props>();
const email = ref('');
const name = ref('');
const password = ref('');
const auth = useAuthStore();
const router = useRouter();

const buttonLabel = computed(() => (props.mode === 'login' ? 'Login' : 'Register'));

async function onSubmit() {
  if (props.mode === 'login') {
    auth.login(email.value, password.value);
  } else {
    auth.register(email.value, name.value, password.value);
  }
  await router.push('/');
}
</script>

