// ===================================
// Quiz Application
// ===================================

class QuizApp {
    constructor() {
        this.quizData = null;
        this.currentLevel = null;
        this.currentChapter = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = [];
        this.init();
    }

    async init() {
        await this.loadQuizData();
        this.setupEventListeners();
        this.renderLevelSelection();
    }

    async loadQuizData() {
        try {
            const response = await fetch('questions.json');
            const data = await response.json();
            this.quizData = data;
        } catch (error) {
            console.error('Erro ao carregar dados do quiz:', error);
            alert('Erro ao carregar as questões. Por favor, recarregue a página.');
        }
    }

    setupEventListeners() {
        document.getElementById('startQuiz').addEventListener('click', () => this.startQuiz());
        document.getElementById('nextQuestion').addEventListener('click', () => this.nextQuestion());
        document.getElementById('restartQuiz').addEventListener('click', () => this.resetQuiz());
        document.getElementById('reviewAnswers').addEventListener('click', () => this.showReview());
        document.getElementById('backToResults').addEventListener('click', () => this.showResults());
        document.getElementById('backToHome').addEventListener('click', () => this.resetQuiz());
    }

    renderLevelSelection() {
        const levelButtons = document.getElementById('levelButtons');
        levelButtons.innerHTML = '';

        if (!this.quizData || !this.quizData.levels) return;

        this.quizData.levels.forEach((level, index) => {
            const button = document.createElement('div');
            button.className = 'level-btn';
            button.innerHTML = `
                <div class="level-btn__title">${level.level}</div>
                <div class="level-btn__description">${level.description}</div>
            `;
            button.addEventListener('click', () => this.selectLevel(index));
            levelButtons.appendChild(button);
        });
    }

    selectLevel(levelIndex) {
        this.currentLevel = levelIndex;
        
        // Highlight selected level
        const levelButtons = document.querySelectorAll('.level-btn');
        levelButtons.forEach((btn, idx) => {
            btn.classList.toggle('selected', idx === levelIndex);
        });

        // Show chapter selection
        this.renderChapterSelection();
        document.getElementById('chapterSelector').style.display = 'block';
        document.getElementById('startQuiz').style.display = 'none';
    }

    renderChapterSelection() {
        const chapterButtons = document.getElementById('chapterButtons');
        chapterButtons.innerHTML = '';

        const level = this.quizData.levels[this.currentLevel];
        
        level.chapters.forEach((chapter, index) => {
            const questionsWithOptions = chapter.questions.filter(q => q.options && q.options.length > 0);
            const button = document.createElement('div');
            button.className = 'chapter-btn';
            button.innerHTML = `
                <div class="chapter-btn__title">Capítulo ${chapter.chapter}: ${chapter.title}</div>
                <div class="chapter-btn__description">${questionsWithOptions.length} questões disponíveis</div>
            `;
            button.addEventListener('click', () => this.selectChapter(index));
            chapterButtons.appendChild(button);
        });
    }

    selectChapter(chapterIndex) {
        this.currentChapter = chapterIndex;
        
        // Highlight selected chapter
        const chapterButtons = document.querySelectorAll('.chapter-btn');
        chapterButtons.forEach((btn, idx) => {
            btn.classList.toggle('selected', idx === chapterIndex);
        });

        // Show start button
        document.getElementById('startQuiz').style.display = 'flex';
    }

    startQuiz() {
        if (this.currentLevel === null || this.currentChapter === null) {
            alert('Por favor, selecione um nível e um capítulo.');
            return;
        }

        // Get questions from selected chapter
        const level = this.quizData.levels[this.currentLevel];
        const chapter = level.chapters[this.currentChapter];
        
        // Filter only questions with options
        this.questions = chapter.questions.filter(q => q.options && q.options.length > 0);
        
        if (this.questions.length === 0) {
            alert('Não há questões disponíveis neste capítulo.');
            return;
        }

        // Shuffle questions
        this.questions = this.shuffleArray(this.questions);

        // Reset quiz state
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = [];

        // Show quiz screen
        this.showScreen('quizScreen');
        this.renderQuestion();
    }

    renderQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        
        // Update progress
        document.getElementById('currentQuestion').textContent = this.currentQuestionIndex + 1;
        document.getElementById('totalQuestions').textContent = this.questions.length;
        document.getElementById('score').textContent = this.score;

        const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
        document.getElementById('progressBar').style.width = `${progress}%`;

        // Render question
        document.getElementById('questionTitle').textContent = question.question;

        // Render options
        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = '';

        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            // Support both 'option' and 'conteudo' properties
            const optionText = option.option || option.conteudo || 'Opção não definida';
            optionElement.innerHTML = `<div class="option__text">${optionText}</div>`;
            optionElement.addEventListener('click', () => this.selectOption(index));
            optionsContainer.appendChild(optionElement);
        });

        // Hide feedback and next button
        document.getElementById('feedback').style.display = 'none';
        document.getElementById('nextQuestion').style.display = 'none';
    }

    selectOption(selectedIndex) {
        const question = this.questions[this.currentQuestionIndex];
        const options = document.querySelectorAll('.option');

        // Prevent selecting if already answered
        if (options[0].classList.contains('disabled')) {
            return;
        }

        // Disable all options
        options.forEach(option => {
            option.classList.add('disabled');
            option.style.cursor = 'not-allowed';
        });

        // Get correct answer index (correctAnswer can be a number or array, 1-based, so subtract 1)
        const correctAnswers = Array.isArray(question.correctAnswer) 
            ? question.correctAnswer.map(idx => idx - 1)
            : [question.correctAnswer - 1];

        // Mark selected and correct options
        options[selectedIndex].classList.add('selected');

        const isCorrect = correctAnswers.includes(selectedIndex);

        if (isCorrect) {
            options[selectedIndex].classList.add('correct');
            this.score += 10;
        } else {
            options[selectedIndex].classList.add('incorrect');
            // Mark all correct answers
            correctAnswers.forEach(idx => {
                options[idx].classList.add('correct');
            });
        }

        // Update score and percentage
        const currentAnswers = this.userAnswers.length + 1;
        const currentCorrect = this.userAnswers.filter(a => a.isCorrect).length + (isCorrect ? 1 : 0);
        const percentage = Math.round((currentCorrect / currentAnswers) * 100);
        
        document.getElementById('score').innerHTML = `${this.score} <span style="font-size: 0.9rem; opacity: 0.8;">(${percentage}%)</span>`;

        // Get explanation text for feedback
        const selectedExplanation = question.options[selectedIndex].explanation;
        const correctExplanation = question.options[correctAnswers[0]].explanation;

        this.showFeedback(isCorrect, selectedExplanation, correctExplanation, correctAnswers, question.options);

        // Store user answer
        this.userAnswers.push({
            question: question.question,
            userAnswer: selectedIndex,
            correctAnswer: correctAnswers,
            options: question.options,
            isCorrect: isCorrect
        });

        // Show next button
        const nextButton = document.getElementById('nextQuestion');
        nextButton.style.display = 'flex';
        
        // Scroll suave para mostrar o botão (mobile)
        setTimeout(() => {
            nextButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }, 400);
    }

    showFeedback(isCorrect, selectedExplanation, correctExplanation, correctAnswers = [], options = []) {
        const feedback = document.getElementById('feedback');
        const feedbackIcon = document.getElementById('feedbackIcon');
        const feedbackText = document.getElementById('feedbackText');

        if (isCorrect) {
            feedbackIcon.textContent = '✓';
            feedbackIcon.style.color = 'var(--color-success)';
            feedbackText.innerHTML = `
                <strong style="color: var(--color-success); font-size: 1.1rem;">Correto!</strong><br>
                <div style="margin-top: 12px; padding: 12px; background: #fff; border-radius: 6px; border-left: 4px solid var(--color-success); box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <span style="color: #323130; font-weight: 500; line-height: 1.6;">${correctExplanation}</span>
                </div>
            `;
        } else {
            feedbackIcon.textContent = '✗';
            feedbackIcon.style.color = 'var(--color-error)';
            
            // Build correct answers list for multiple correct answers
            let correctAnswersHTML = '';
            if (correctAnswers.length > 1) {
                correctAnswersHTML = '<strong style="color: #107c10; font-size: 0.95rem;">Respostas corretas:</strong><br>';
                correctAnswers.forEach(idx => {
                    const optionText = options[idx].option || options[idx].conteudo || 'Opção não definida';
                    const explanation = options[idx].explanation || '';
                    correctAnswersHTML += `
                        <div style="margin-bottom: 8px; padding-left: 8px; border-left: 2px solid var(--color-success);">
                            <span style="color: #323130; font-weight: 500;">${optionText}</span><br>
                            <span style="color: #605e5c; font-size: 0.9rem; line-height: 1.6;">${explanation}</span>
                        </div>
                    `;
                });
            } else {
                correctAnswersHTML = `
                    <strong style="color: #107c10; font-size: 0.95rem;">Resposta correta:</strong><br>
                    <span style="color: #323130; font-weight: 500; line-height: 1.6;">${correctExplanation}</span>
                `;
            }
            
            feedbackText.innerHTML = `
                <strong style="color: var(--color-error); font-size: 1.1rem;">Incorreto!</strong><br>
                <div style="margin: 12px 0 10px 0; padding: 12px; background: #fff; border-radius: 6px; border-left: 4px solid var(--color-error); box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <strong style="color: #d13438; font-size: 0.95rem;">Sua escolha:</strong><br>
                    <span style="color: #323130; font-weight: 500; line-height: 1.6;">${selectedExplanation}</span>
                </div>
                <div style="padding: 12px; background: #fff; border-radius: 6px; border-left: 4px solid var(--color-success); box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    ${correctAnswersHTML}
                </div>
            `;
        }

        feedback.style.display = 'block';
    }

    nextQuestion() {
        this.currentQuestionIndex++;

        if (this.currentQuestionIndex < this.questions.length) {
            this.renderQuestion();
        } else {
            this.showResults();
        }
    }

    showResults() {
        const totalQuestions = this.questions.length;
        const correctAnswers = this.userAnswers.filter(a => a.isCorrect).length;
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);

        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('correctAnswers').textContent = correctAnswers;
        document.getElementById('totalQuestionsResult').textContent = totalQuestions;
        document.getElementById('percentageScore').textContent = `${percentage}%`;

        // Set icon and message based on performance
        const resultsIcon = document.getElementById('resultsIcon');
        const resultsMessage = document.getElementById('resultsMessage');

        if (percentage >= 80) {
            resultsIcon.textContent = '🏆';
            resultsMessage.innerHTML = '<strong style="color: var(--color-success)">Excelente!</strong> Você está pronto para a certificação!';
            resultsMessage.style.background = 'linear-gradient(135deg, #e5f5e5 0%, #d4edda 100%)';
        } else if (percentage >= 70) {
            resultsIcon.textContent = '🎯';
            resultsMessage.innerHTML = '<strong style="color: var(--color-primary)">Muito Bom!</strong> Você tem grandes chances de aprovação!';
            resultsMessage.style.background = 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)';
        } else if (percentage >= 60) {
            resultsIcon.textContent = '👍';
            resultsMessage.innerHTML = '<strong style="color: var(--color-primary)">Bom trabalho!</strong> Continue estudando para melhorar ainda mais.';
            resultsMessage.style.background = 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)';
        } else {
            resultsIcon.textContent = '📚';
            resultsMessage.innerHTML = '<strong style="color: var(--color-warning)">Continue praticando!</strong> Revise os conceitos e tente novamente.';
            resultsMessage.style.background = 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)';
        }

        this.showScreen('resultsScreen');
    }

    showReview() {
        const reviewContainer = document.getElementById('reviewContainer');
        reviewContainer.innerHTML = '';

        this.userAnswers.forEach((answer, index) => {
            const reviewItem = document.createElement('div');
            reviewItem.className = 'review-item';

            const statusClass = answer.isCorrect ? 'correct' : 'incorrect';
            const statusText = answer.isCorrect ? 'Correto' : 'Incorreto';

            let answerHTML = '';
            
            if (!answer.isCorrect) {
                const userAnswerText = answer.options[answer.userAnswer].option || answer.options[answer.userAnswer].conteudo;
                answerHTML += `
                    <div class="review-item__answer review-item__answer--user">
                        <strong>Sua resposta:</strong> ${userAnswerText}
                    </div>
                `;
            }

            // Handle multiple correct answers
            const correctAnswers = Array.isArray(answer.correctAnswer) ? answer.correctAnswer : [answer.correctAnswer];
            if (correctAnswers.length > 1) {
                answerHTML += '<div class="review-item__answer review-item__answer--correct"><strong>Respostas corretas:</strong>';
                correctAnswers.forEach((idx, i) => {
                    const correctAnswerText = answer.options[idx].option || answer.options[idx].conteudo;
                    answerHTML += `<br>${i + 1}. ${correctAnswerText}`;
                });
                answerHTML += '</div>';
            } else {
                const correctAnswerText = answer.options[correctAnswers[0]].option || answer.options[correctAnswers[0]].conteudo;
                answerHTML += `
                    <div class="review-item__answer review-item__answer--correct">
                        <strong>Resposta correta:</strong> ${correctAnswerText}
                    </div>
                `;
            }

            reviewItem.innerHTML = `
                <div class="review-item__header">
                    <span class="review-item__number">Questão ${index + 1}</span>
                    <span class="review-item__status review-item__status--${statusClass}">${statusText}</span>
                </div>
                <div class="review-item__question">${answer.question}</div>
                ${answerHTML}
                <div class="review-item__explanation">
                    <strong>Explicação:</strong> ${answer.options[correctAnswers[0]].explanation}
                </div>
            `;

            reviewContainer.appendChild(reviewItem);
        });

        this.showScreen('reviewScreen');
    }

    resetQuiz() {
        this.currentLevel = null;
        this.currentChapter = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = [];

        // Reset selections
        document.querySelectorAll('.level-btn, .chapter-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        document.getElementById('chapterSelector').style.display = 'none';
        document.getElementById('startQuiz').style.display = 'none';

        this.showScreen('homeScreen');
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QuizApp();
});
