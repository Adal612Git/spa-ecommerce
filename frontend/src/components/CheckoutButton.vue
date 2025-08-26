<template>
  <q-btn color="primary" :label="label" @click="$emit('click')" />
</template>

<script setup lang="ts">
interface Props {
  label?: string;
}

withDefaults(defineProps<Props>(), {
  label: 'Pagar',
});

defineEmits(['click']);
</script>

