class Character {
    constructor(name, health, damage, defense, movementBonus, combatForm, hasWeapon = true, hasShield = false, skilledUnarmed = false, dexterity = 0, will = 0, hasRelentlessness = false, verbose = true) {
        this.name = name;
        this.health = health;
        this.damage = damage;
        this.defense = defense;
        this.movementBonus = movementBonus;
        this.combatForm = combatForm; // e.g., { dice: 1, modifier: 2 } or { dice: 2, modifier: 0 }
        this.hasWeapon = hasWeapon;
        this.hasShield = hasShield;
        this.skilledUnarmed = skilledUnarmed;
        this.dexterity = dexterity;
        this.will = will;
        this.sparkUses = dexterity;
        this.hasRelentlessness = hasRelentlessness;
        this.verbose = verbose;  // Control verbose output
    }

    log(message) {
        if (this.verbose) {
            console.log(message);
        }
    }

    rollDice(count) {
        return Array.from({ length: count }, () => Math.floor(Math.random() * 6 + 1)).reduce((a, b) => a + b, 0);
    }

    attack(useSpark = false, roundNumber) {
        let baseAttack = this.rollDice(this.combatForm.dice);
        let modifier = this.combatForm.modifier;

        if (useSpark && this.sparkUses > 0) {
            modifier += Math.floor(Math.random() * 6 + 1) + this.will;
            this.sparkUses--;
            this.log(`${this.name} използва "Блясък" и добавя 1 зар 6 към атаката`);
        } else if (this.hasRelentlessness && roundNumber % 2 === 0) {
            modifier += Math.floor(Math.random() * 6 + 1) + this.will;
            this.log(`${this.name} използва "Непримиримост" и добавя 1 зар 6 + ${this.will} към атаката през четен рунд`);
        }
        let totalAttack = baseAttack + modifier;
        this.log(`${this.name} атакува с стойност: ${totalAttack} (${baseAttack} от зарове + ${modifier} модификатор)`);
        return totalAttack;
    }

    defend(roundNumber) {
        let baseDefense = this.rollDice(this.combatForm.dice) + this.combatForm.modifier;
        this.log(`${this.name} се защитава със стойност ${baseDefense}`);
        return baseDefense;
    }

    takeDamage(attackValue, defenseValue) {
        if (attackValue > defenseValue) {
            let attackDamage = attackValue;  // Damage from the attack roll exceeding defense
            let totalDamage = attackDamage + this.damage;  // Total damage includes weapon damage
            this.health -= totalDamage;
            this.log(`${this.name} получава ${totalDamage} точки щети от успешен удар (${attackDamage} атака + ${this.damage} щети от оръжие), животът му сега е ${this.health}`);
            return this.health <= 0;
        }
        this.log(`${this.name} не получава щети, атаката не е успешна.`);
        return false;
    }

    counterAttack(defenseValue, attackValue) {
        if (defenseValue > attackValue) {
            let counterDamage = this.damage + defenseValue - attackValue;  // Add the character's base damage only on successful counterattack
            this.log(`${this.name} извършва контраатака и нанася ${counterDamage} точки щети!`);
            return counterDamage;
        }
        return 0;
    }
}

function combatRound(attacker, defender, useSpark = false, roundNumber) {
    console.log(`Рунд ${roundNumber}: ${attacker.name} атакува и ${defender.name} се защитава`);
    const attackValue = attacker.attack(useSpark, roundNumber);
    const defenseValue = defender.defend(roundNumber);
    if (roundNumber == 0) {
        if (defender.takeDamage(attackValue, 0)) {
            console.log(`${defender.name} е повален!`);
            return true;
        }
    }
    else if (attackValue > defenseValue) {
        if (defender.takeDamage(attackValue, defenseValue)) {
            console.log(`${defender.name} е повален!`);
            return true;
        }
    } else {
        console.log(`Атаката не беше успешна.`);
        const counterDamage = defender.counterAttack(defenseValue, attackValue);
        if (counterDamage > 0) {
            attacker.health -= counterDamage;
            console.log(`${attacker.name} получава контраатака и животът му сега е ${attacker.health}`);
            if (attacker.health <= 0) {
                console.log(`${attacker.name} е повален от контраатака!`);
                return true;
            }
        }
    }
    return false;
}

function combatSimulation(initialHeroAdvantage = false) {
    // Example initialization
    let hero = new Character("Хирул", 14, 2, 0, 0, { dice: 1, modifier: 2 }, true, false, false, 4, 0, false, true);
    let enemy = new Character("Зодаир", 30, 2, 0, 3, { dice: 2, modifier: 0 }, true, false, false, 0, 2, true, true);

    let roundNumber = 0;

    // Initial advantage for the hero
    if (initialHeroAdvantage) {
        console.log("Първите атаки на героя попадат автоматично в целта:");
        for (let i = 0; i < 2; i++) {
            combatRound(hero, enemy, true, roundNumber);  // Use combatRound to handle attack
        }
    }

    roundNumber = 1;

    // Normal combat rounds
    while (hero.health > 0 && enemy.health > 0) {
        let firstMover = determineFirstMover(hero, enemy);
        let secondMover = firstMover === hero ? enemy : hero;

        if (combatRound(firstMover, secondMover, true, roundNumber)) break;
        if (secondMover.health > 0 && combatRound(secondMover, firstMover, true, roundNumber)) break;
        roundNumber++;
    }

    const winner = hero.health > 0 ? hero : enemy;
    console.log(`${winner.name} побеждава, останал на ${winner.health} живот!`);
}


function combatSimulationQuick(hero, enemy, initialHeroAdvantage = false, verbose = true) {
    hero.verbose = enemy.verbose = verbose; // Set verbosity based on the simulation setting
    let roundNumber = 0;

    if (initialHeroAdvantage) {
        for (let i = 0; i < 2; i++) {
            combatRound(hero, enemy, true, roundNumber);
        }
    }

    roundNumber = 1;
    while (hero.health > 0 && enemy.health > 0) {
        let firstMover = determineFirstMover(hero, enemy);
        let secondMover = firstMover === hero ? enemy : hero;

        if (combatRound(firstMover, secondMover, true, roundNumber)) break;
        if (secondMover.health > 0 && combatRound(secondMover, firstMover, true, roundNumber)) break;
        roundNumber++;
    }

    return hero.health > 0 ? hero.name : enemy.name;
}

function runMultipleBattles(numBattles) {
    let heroWins = 0;
    let enemyWins = 0;
    for (let i = 0; i < numBattles; i++) {
        let hero = new Character("Хирул", 14, 2, 0, 0, { dice: 1, modifier: 2 }, true, false, false, 5, 0, false, false);
        let enemy = new Character("Зодаир", 30, 2, 0, 3, { dice: 2, modifier: 0 }, true, false, false, 0, 2, true, false);
        let winner = combatSimulationQuick(hero, enemy, true, false);  // false for verbosity
        if (winner === "Хирул") {
            heroWins++;
        } else {
            enemyWins++;
        }
    }
    console.log(`От ${numBattles} битки, Хирул победи ${heroWins} пъти, а Зодаир победи ${enemyWins}.`);
}

runMultipleBattles(1000);  

// combatSimulation(true);  // Set to false to run a normal simulation