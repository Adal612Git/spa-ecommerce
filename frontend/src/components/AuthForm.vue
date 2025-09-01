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

interface Props {
  mode: 'login' | 'register';
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (
    e: 'submit',
    payload: { email: string; name: string; password: string }
  ): void;
}>();

const email = ref('');
const name = ref('');
const password = ref('');

const buttonLabel = computed(() => (props.mode === 'login' ? 'Login' : 'Register'));

function onSubmit() {
  emit('submit', {
    email: email.value,
    name: name.value,
    password: password.value,
  });
}
</script>

