const userRepository = require('../repositories/userRepository');
const sessionRepository = require('../repositories/sessionRepository');
const messages = require('../constants/messages');
const { GRADE_LIST } = require('../constants/grades');
const { replySafely } = require('../utils/lineReplyHelper');

/**
 * 初回登録フローの開始
 * フルネームの入力を促す
 */
async function startRegistration(event) {
  const lineUserId = event.source.userId;

  // セッションを作成（フルネーム入力待ち）
  await sessionRepository.createSession(lineUserId, 'registration', 'input_full_name', {});

  await replySafely(event, {
    type: 'text',
    text: messages.REGISTRATION_START,
  });
}

/**
 * フルネーム入力を処理
 */
async function handleFullNameInput(event, session) {
  const lineUserId = event.source.userId;
  const fullName = event.message.text.trim();

  // 入力検証
  if (!fullName || fullName.length < 2) {
    await replySafely(event, {
      type: 'text',
      text: messages.REGISTRATION_INVALID_NAME,
    });
    return;
  }

  // セッションを更新（学年選択待ち）
  await sessionRepository.updateSession(lineUserId, 'registration', 'select_grade', {
    full_name: fullName,
  });

  // 学年選択のクイックリプライを表示
  await replySafely(event, {
    type: 'text',
    text: messages.REGISTRATION_GRADE_SELECT(fullName),
    quickReply: {
      items: GRADE_LIST.map((grade) => ({
        type: 'action',
        action: {
          type: 'postback',
          label: grade,
          data: `action=select_grade&grade=${encodeURIComponent(grade)}`,
          displayText: grade,
        },
      })),
    },
  });
}

/**
 * 学年選択を処理
 */
async function handleGradeSelection(event, postbackData, session) {
  const lineUserId = event.source.userId;
  const grade = postbackData.grade;
  const fullName = session.session_data?.full_name;

  if (!fullName) {
    // セッションデータが不正な場合は最初からやり直し
    await startRegistration(event);
    return;
  }

  // ユーザー情報を更新（登録完了）
  await userRepository.completeRegistration(lineUserId, fullName, grade);

  // セッションを削除
  await sessionRepository.deleteSession(lineUserId);

  // 登録完了メッセージ
  await replySafely(event, {
    type: 'text',
    text: messages.REGISTRATION_COMPLETE(fullName, grade),
  });
}

/**
 * ユーザーが登録済みかチェック
 * 未登録の場合は登録フローを開始
 * @returns {boolean} 登録済みならtrue
 */
async function checkAndStartRegistration(event) {
  const lineUserId = event.source.userId;
  let user = await userRepository.getUserByLineId(lineUserId);

  // ユーザーレコードが存在しない場合は作成
  if (!user) {
    const { client } = require('../config/line');
    try {
      const profile = await client.getProfile(lineUserId);
      user = await userRepository.getOrCreateUser(lineUserId, profile.displayName);
      console.log('✅ ユーザーレコード作成:', lineUserId, profile.displayName);
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
      // プロフィール取得に失敗した場合は仮の名前で作成
      user = await userRepository.getOrCreateUser(lineUserId, 'ユーザー');
    }
  }

  // ユーザーが登録完了している場合は何もしない
  if (user?.registration_completed) {
    return true;
  }

  // 未登録の場合は登録フローを開始
  await startRegistration(event);
  return false;
}

module.exports = {
  startRegistration,
  handleFullNameInput,
  handleGradeSelection,
  checkAndStartRegistration,
};
