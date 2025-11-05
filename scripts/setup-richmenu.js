require('dotenv').config();
const { Client } = require('@line/bot-sdk');
const fs = require('fs');
const path = require('path');
const richMenuConfig = require('../src/constants/richMenu');

const client = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

/**
 * リッチメニューをセットアップ
 */
async function setupRichMenu() {
  try {
    console.log('🚀 リッチメニューの設定を開始します...');

    // 1. 既存のリッチメニューを取得
    const existingMenus = await client.getRichMenuList();
    console.log(`既存のリッチメニュー数: ${existingMenus.length}`);

    // 2. 新しいリッチメニューを作成
    console.log('新しいリッチメニューを作成中...');
    const richMenuId = await client.createRichMenu(richMenuConfig);
    console.log(`✅ リッチメニューを作成しました: ${richMenuId}`);

    // 3. 画像をアップロード（画像が存在する場合）
    const imagePath = path.join(__dirname, '../assets/richmenu/richmenu.png');
    if (fs.existsSync(imagePath)) {
      console.log('リッチメニュー画像をアップロード中...');
      const imageBuffer = fs.readFileSync(imagePath);
      await client.setRichMenuImage(richMenuId, imageBuffer, 'image/png');
      console.log('✅ 画像をアップロードしました');
    } else {
      console.log('⚠️  画像が見つかりません。画像を作成してからアップロードしてください:');
      console.log(`   ${imagePath}`);
      console.log('   サイズ: 2500 x 843 px');
    }

    // 4. デフォルトのリッチメニューとして設定
    console.log('デフォルトのリッチメニューとして設定中...');
    await client.setDefaultRichMenu(richMenuId);
    console.log('✅ デフォルトのリッチメニューとして設定しました');

    // 5. 既存の古いリッチメニューを削除（オプション）
    if (existingMenus.length > 0) {
      console.log('\\n古いリッチメニューを削除しますか？ (y/n)');
      console.log('（このスクリプトは自動削除しません。手動で削除してください）');

      for (const menu of existingMenus) {
        console.log(`  - リッチメニューID: ${menu.richMenuId} (名前: ${menu.name})`);
        console.log(`    削除コマンド: node scripts/delete-richmenu.js ${menu.richMenuId}`);
      }
    }

    console.log('\\n✅ リッチメニューのセットアップが完了しました！');
    console.log(`リッチメニューID: ${richMenuId}`);

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    if (error.response) {
      console.error('詳細:', error.response.data);
    }
    process.exit(1);
  }
}

setupRichMenu();
