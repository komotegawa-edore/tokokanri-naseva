require('dotenv').config();
const { Client } = require('@line/bot-sdk');

const client = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

/**
 * リッチメニューを削除
 */
async function deleteRichMenu() {
  const richMenuId = process.argv[2];

  if (!richMenuId) {
    console.log('使い方: node scripts/delete-richmenu.js <richMenuId>');
    console.log('\\n既存のリッチメニューを確認中...');

    try {
      const menus = await client.getRichMenuList();
      if (menus.length === 0) {
        console.log('リッチメニューが見つかりませんでした。');
        return;
      }

      console.log('\\n既存のリッチメニュー:');
      for (const menu of menus) {
        console.log(`  - ID: ${menu.richMenuId}`);
        console.log(`    名前: ${menu.name}`);
        console.log(`    サイズ: ${menu.size.width}x${menu.size.height}`);
        console.log('');
      }
    } catch (error) {
      console.error('エラー:', error.message);
    }
    return;
  }

  try {
    await client.deleteRichMenu(richMenuId);
    console.log(`✅ リッチメニューを削除しました: ${richMenuId}`);
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    if (error.response) {
      console.error('詳細:', error.response.data);
    }
  }
}

deleteRichMenu();
