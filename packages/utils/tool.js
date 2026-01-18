import paimon from '../assets/imgs/paimon_menu.png';

/**
 * 获取图片 Mat（支持单路径 / 路径数组）
 *
 * @param {string|string[]} path 图片路径或路径数组
 * @returns {Mat|Mat[]} OpenCV Mat 或 Mat 数组
 */
function getImgMat(path) {
  if (path == null) {
    throw new Error('getImgMat: path 不能为空');
  }

  // 数组形式
  if (Array.isArray(path)) {
    return path.map((p, index) => {
      if (typeof p !== 'string' || !p) {
        throw new Error(`getImgMat: path[${index}] 不是有效字符串`);
      }
      return file.readImageMatSync(p);
    });
  }

  // 单个路径
  if (typeof path !== 'string') {
    throw new Error('getImgMat: path 必须是字符串或字符串数组');
  }

  return file.readImageMatSync(path);
}

/**
 * 通用找图/找RO（支持单图片文件路径、单RO）
 * @param {string|RecognitionObject} target 图片路径或已构造的 RecognitionObject
 * @param {number} [x=0] 识别区域左上角 X
 * @param {number} [y=0] 识别区域左上角 Y
 * @param {number} [w=1920] 识别区域宽度
 * @param {number} [h=1080] 识别区域高度
 * @param {number} [timeout=3000] 识别时间上限（毫秒）
 * @param {number} [interval=50] 每次识别之间的等待间隔（毫秒）
 *
 * @returns
 * - RecognitionResult | null
 */
async function findImg(
  target,
  x = 0,
  y = 0,
  w = 1920,
  h = 1080,
  timeout = 3000,
  interval = 50
) {
  const ro =
    typeof target === 'string'
      ? RecognitionObject.TemplateMatch(
        file.readImageMatSync(target),
        x, y, w, h
      )
      : target;

  const start = Date.now();

  while (Date.now() - start <= timeout) {
    const gameRegion = captureGameRegion();
    try {
      const res = gameRegion.find(ro);
      if (!res.isEmpty()) {
        return res;
      }
    } finally {
      gameRegion.dispose();
    }

    await sleep(interval);
  }

  return null;
}

/**
 * 通用找图并点击（支持单图片文件路径、单RO）
 * @param {string|RecognitionObject} target 图片路径或已构造的 RecognitionObject
 * @param {number} [x=0] 识别区域左上角 X
 * @param {number} [y=0] 识别区域左上角 Y
 * @param {number} [w=1920] 识别区域宽度
 * @param {number} [h=1080] 识别区域高度
 * @param {number} [timeout=3000] 识别时间上限（毫秒）
 * @param {number} [interval=50] 每次识别之间的等待间隔（毫秒）
 * @param {number} [preClickDelay=50] 点击前等待时间（毫秒）
 * @param {number} [postClickDelay=50] 点击后等待时间（毫秒）
 *
 * @returns
 * - RecognitionResult | null
 */
async function findImgAndClick(
  target,
  x = 0,
  y = 0,
  w = 1920,
  h = 1080,
  timeout = 3000,
  interval = 50,
  preClickDelay = 50,
  postClickDelay = 50
) {
  const ro =
    typeof target === 'string'
      ? RecognitionObject.TemplateMatch(
        file.readImageMatSync(target),
        x, y, w, h
      )
      : target;

  const start = Date.now();

  while (Date.now() - start <= timeout) {
    const gameRegion = captureGameRegion();
    try {
      const res = gameRegion.find(ro);
      if (!res.isEmpty()) {
        await sleep(preClickDelay);
        res.click();
        await sleep(postClickDelay);
        return res;
      }
    } finally {
      gameRegion.dispose();
    }

    await sleep(interval);
  }

  return null;
}

/**
 * 通用找文本（OCR）
 * @param {string} text 需要匹配的文本（包含即可）
 * @param {number} [x=0] OCR 区域左上角 X
 * @param {number} [y=0] OCR 区域左上角 Y
 * @param {number} [w=1920] OCR 区域宽度
 * @param {number} [h=1080] OCR 区域高度
 * @param {number} [attempts=5] OCR 尝试次数
 * @param {number} [interval=50] 每次 OCR 之间的等待间隔（毫秒）
 *
 * @returns
 * - RecognitionResult | null
 */
async function findText(
  text,
  x = 0,
  y = 0,
  w = 1920,
  h = 1080,
  attempts = 5,
  interval = 50
) {
  const keyword = text.toLowerCase();

  for (let i = 0; i < attempts; i++) {
    const gameRegion = captureGameRegion();
    try {
      const ro = RecognitionObject.Ocr(x, y, w, h);
      const results = gameRegion.findMulti(ro);

      for (let j = 0; j < results.count; j++) {
        const res = results[j];
        if (
          res.isExist() &&
          res.text &&
          res.text.toLowerCase().includes(keyword)
        ) {
          return res;
        }
      }
    } finally {
      gameRegion.dispose();
    }

    await sleep(interval);
  }

  return null;
}

/**
 * 通用找文本并点击（OCR）
 * @param {string} text 需要匹配的文本（包含即可）
 * @param {number} [x=0] OCR 区域左上角 X
 * @param {number} [y=0] OCR 区域左上角 Y
 * @param {number} [w=1920] OCR 区域宽度
 * @param {number} [h=1080] OCR 区域高度
 * @param {number} [attempts=5] OCR 尝试次数
 * @param {number} [interval=50] 每次 OCR 之间的等待间隔（毫秒）
 * @param {number} [preClickDelay=50] 点击前等待时间（毫秒）
 * @param {number} [postClickDelay=50] 点击后等待时间（毫秒）
 *
 * @returns
 * - RecognitionResult | null
 */
async function findTextAndClick(
  text,
  x = 0,
  y = 0,
  w = 1920,
  h = 1080,
  attempts = 5,
  interval = 50,
  preClickDelay = 50,
  postClickDelay = 50
) {
  const keyword = text.toLowerCase();

  for (let i = 0; i < attempts; i++) {
    const gameRegion = captureGameRegion();
    try {
      const ro = RecognitionObject.Ocr(x, y, w, h);
      const results = gameRegion.findMulti(ro);

      for (let j = 0; j < results.count; j++) {
        const res = results[j];
        if (
          res.isExist() &&
          res.text &&
          res.text.toLowerCase().includes(keyword)
        ) {
          await sleep(preClickDelay);
          res.click();
          await sleep(postClickDelay);
          return res;
        }
      }
    } finally {
      gameRegion.dispose();
    }

    await sleep(interval);
  }

  return null;
}

/**
 * 执行操作直到图片出现
 * @param {string|RecognitionObject} target 目标图片路径或 RecognitionObject
 * @param {() => Promise<void>} action 执行的操作函数
 * @param {number} [x=0] 识别区域左上角 X
 * @param {number} [y=0] 识别区域左上角 Y
 * @param {number} [w=1920] 识别区域宽度
 * @param {number} [h=1080] 识别区域高度
 * @param {number} [timeout=5000] 超时时间（毫秒）
 * @param {number} [interval=50] 操作和识别间隔（毫秒）
 *
 * @returns
 * - RecognitionResult | null
 */
async function waitUntilImgAppear(
  target,
  action,
  x = 0,
  y = 0,
  w = 1920,
  h = 1080,
  timeout = 5000,
  interval = 50
) {
  const start = Date.now();

  while (Date.now() - start <= timeout) {
    await action();
    const res = await findImg(target, x, y, w, h, interval);
    if (res) return res;
    await sleep(interval);
  }

  return null;
}

/**
 * 执行操作直到图片消失
 * @param {string|RecognitionObject} target 目标图片路径或 RecognitionObject
 * @param {() => Promise<void>} action 执行的操作函数
 * @param {number} [x=0] 识别区域左上角 X
 * @param {number} [y=0] 识别区域左上角 Y
 * @param {number} [w=1920] 识别区域宽度
 * @param {number} [h=1080] 识别区域高度
 * @param {number} [timeout=5000] 超时时间（毫秒）
 * @param {number} [interval=50] 操作和识别间隔（毫秒）
 *
 * @returns
 * - true: 图片已消失, false: 超时
 */
async function waitUntilImgDisappear(
  target,
  action,
  x = 0,
  y = 0,
  w = 1920,
  h = 1080,
  timeout = 5000,
  interval = 50
) {
  const start = Date.now();

  while (Date.now() - start <= timeout) {
    await action();
    const res = await findImg(target, x, y, w, h, interval);
    if (!res) return true;
    await sleep(interval);
  }

  return false;
}

/**
 * 执行操作直到文本出现
 * @param {string} text 目标文本
 * @param {() => Promise<void>} action 执行的操作函数
 * @param {number} [x=0] OCR 区域左上角 X
 * @param {number} [y=0] OCR 区域左上角 Y
 * @param {number} [w=1920] OCR 区域宽度
 * @param {number} [h=1080] OCR 区域高度
 * @param {number} [attempts=5] OCR 尝试次数
 * @param {number} [interval=50] 操作和识别间隔（毫秒）
 *
 * @returns
 * - RecognitionResult | null
 */
async function waitUntilTextAppear(
  text,
  action,
  x = 0,
  y = 0,
  w = 1920,
  h = 1080,
  attempts = 5,
  interval = 50
) {
  const start = Date.now();

  while (Date.now() - start <= attempts * interval) {
    await action();
    const res = await findText(text, x, y, w, h, 1, interval); // 每次只试 1 次 OCR
    if (res) return res;
    await sleep(interval);
  }

  return null;
}

/**
 * 执行操作直到文本消失
 * @param {string} text 目标文本
 * @param {() => Promise<void>} action 执行的操作函数
 * @param {number} [x=0] OCR 区域左上角 X
 * @param {number} [y=0] OCR 区域左上角 Y
 * @param {number} [w=1920] OCR 区域宽度
 * @param {number} [h=1080] OCR 区域高度
 * @param {number} [attempts=5] OCR 尝试次数
 * @param {number} [interval=50] 操作和识别间隔（毫秒）
 *
 * @returns
 * - true: 文本已消失, false: 超时
 */
async function waitUntilTextDisappear(
  text,
  action,
  x = 0,
  y = 0,
  w = 1920,
  h = 1080,
  attempts = 5,
  interval = 50
) {
  const start = Date.now();

  while (Date.now() - start <= attempts * interval) {
    await action();
    const res = await findText(text, x, y, w, h, 1, interval); // 每次只试 1 次 OCR
    if (!res) return true;
    await sleep(interval);
  }

  return false;
}

async function isInMainUI() {
  const result = await findImage(paimon);
  return !!result;
}

export {
  getImgMat,
  findImg,
  findImgAndClick,
  findText,
  findTextAndClick,
  waitUntilImgAppear,
  waitUntilImgDisappear,
  waitUntilTextAppear,
  waitUntilTextDisappear,
  isInMainUI
};