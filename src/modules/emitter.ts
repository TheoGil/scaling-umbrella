import mitt from "mitt";

const emitter = mitt<{
  fail?: null;
  resetPlayer?: null;
}>();

export { emitter };
