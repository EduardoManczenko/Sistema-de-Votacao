
let userWallet = document.getElementById('carteira')
let saldoUsdt = document.getElementById('saldoUsdt')
let saldoFragmentos = document.getElementById('saldoFragmentos')
let amountUsdt = document.getElementById('amount')
let saldoNft = document.getElementById('saldoNft')
let votoForm = document.getElementById('votoForm')


async function loginMetamask(){
    let accounts = await ethereum.request({method: 'eth_requestAccounts'})
    userWallet.innerHTML = accounts[0]
    await getUsdtBalance()
    await getFragBalance()
    await getNftBalance()
}

async function attSaldo(){
    await getUsdtBalance()
    await getFragBalance()
    await getNftBalance()
}

function getProvider(){
    if(!window.ethereum){
        console.log('Sem metamask instalada')
    }else{
        console.log('Processando...')
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    return provider
}

async function getUsdtBalance(){
    const provider = getProvider()
    const usdtContract = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"
    const contract = new ethers.Contract(usdtContract, ["function balanceOf(address) view returns (uint)"], provider)
    const balanceUsdt = await contract.balanceOf(userWallet.innerHTML)
    saldoUsdt.innerHTML = ethers.utils.formatUnits(balanceUsdt.toString(), 18)
}

async function getFragBalance(){
    const provider = getProvider()
    const fragContract = "0x777040322d59Faf5eE977e02e759af74Fcb51748"
    const contract = new ethers.Contract(fragContract, ["function balanceOf(address) view returns (uint)"], provider)
    const balanceFrag = await contract.balanceOf(userWallet.innerHTML)
    saldoFragmentos.innerHTML = ethers.utils.formatUnits(balanceFrag.toString(), 18)
}

async function getNftBalance(){
    const provider = getProvider()
    const nftContract = "0x7e5ab5B589Ca7a7A0c2e614b540C2809501CeBAB"
    const contract = new ethers.Contract(nftContract, ["function returnNftList(address _key)external view returns(uint256[] memory)"], provider)
    const balanceNft = await contract.returnNftList(userWallet.innerHTML)
    saldoNft.innerHTML = balanceNft
    return balanceNft
}

async function permissaoUsdt(){
    const provider = getProvider()
    const signer = provider.getSigner()
    const usdtContract = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"
    const swapContract = "0xab115d3d4F24Eda782c36481A1222DA06Ee9a71D"
    console.log(swapContract)
    const contract = new ethers.Contract(usdtContract, ["function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool)", "function allowance(address owner, address spender) public view virtual override returns (uint256)"], provider)
    const contractSigner = contract.connect(signer)
    const tx = await contractSigner.increaseAllowance(swapContract, ethers.utils.parseUnits(amountUsdt.value))
    while(true){
        const permi = await contractSigner.allowance(userWallet.innerHTML, swapContract)
        console.log(permi)
        if(permi["_hex"] != "0x00"){
            break
        }
    }
    return tx
}

async function enviarUsdt(){
    await permissaoUsdt()

    const provider = getProvider()
    const signer = provider.getSigner()
    const swapContract = "0xab115d3d4F24Eda782c36481A1222DA06Ee9a71D"
    const contract = new ethers.Contract(swapContract,["function swap(uint256 _amount, address _from) external returns(bool)"], provider)
    const contractSigner = contract.connect(signer)
    const tx = await contractSigner.swap(ethers.utils.parseUnits(amountUsdt.value), userWallet.innerHTML)
    console.log(tx)

    await getUsdtBalance()
    await getFragBalance()
}

async function permissaoFragToMint(){
    const provider = getProvider()
    const signer = provider.getSigner()
    const fragContract = "0x777040322d59Faf5eE977e02e759af74Fcb51748"
    const mintContract = "0x7e5ab5B589Ca7a7A0c2e614b540C2809501CeBAB"
    const contract = new ethers.Contract(fragContract, ["function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool)", "function allowance(address owner, address spender) public view virtual override returns (uint256)"], provider)
    const contractSigner = contract.connect(signer)
    const tx = await contractSigner.increaseAllowance(mintContract, ethers.utils.parseUnits("10", 18))
    console.log(tx)
    while(true){
        const permi = await contractSigner.allowance(userWallet.innerHTML,mintContract)
        console.log(permi)
        if(permi["_hex"] != "0x00"){
            break
        }
    }
    return tx
}

async function mint(){
    await permissaoFragToMint()

    const provider = getProvider()
    const signer = provider.getSigner()
    const mintContract = "0x7e5ab5B589Ca7a7A0c2e614b540C2809501CeBAB"
    const contract = new ethers.Contract(mintContract, ["function Mint(address _address) external returns(bool)"], provider)
    const contractSigner = contract.connect(signer)
    const tx = await contractSigner.Mint(userWallet.innerHTML)
    console.log(tx)

    await getUsdtBalance()
    await getFragBalance()
    await getNftBalance()
}

let acesso = false
async function votarPerm(){
    const nft = await getNftBalance()
    console.log(nft[0])
    if(nft[0] == null){
        votoForm.innerHTML = "<h2>Sem Permissão para votar, compre uma NFT e tente novamente</h2>"
        acesso = false
    }else if(nft[0]["_hex"] != []){
        console.log('ENTROUUUU')
        votoForm.innerHTML = "<p><h2>Contagem</h2><h3>Azul: <span id='contAzul'>0</span></h3><h3>Amarelo: <span id='contAmarelo'>0</span></h3><button onclick='consultarVotos()'>Atualizar Contagem</button><br><input type='radio' name='option' value='azul'>Azul<input type='radio' name='option' value='amarela'>Amarelo<button onclick='enviarVoto()'>Votar</button></p>"
        acesso = true
        await consultarVotos()
    }
}

async function consultarVotos(){
    if(acesso == false){
        console.log("Sem acesso")
    }else if(acesso == true){
        const provider = getProvider()
        const voteContract = "0x5FB0A1Ee26f7dD41f28d2258a2892dc6332F87DF"
        const contract = new ethers.Contract(voteContract,["function consultarVotos(uint256 _choice)external view returns(uint256)"], provider)

        const totAzul = await contract.consultarVotos(1)
        const totAmarelo = await contract.consultarVotos(2)

        let contAzul = document.getElementById('contAzul')
        let contAmarelo = document.getElementById('contAmarelo')

        contAzul.innerHTML = totAzul
        contAmarelo.innerHTML = totAmarelo
    }
}


async function enviarVoto(){
    if(acesso == false){
        console.log("Sem acesso")
    }else if(acesso == true){
        let radios = document.getElementsByName('option')
        for (let i = 0; i < radios.length; i++){
            if(radios[i].checked){
                console.log(radios[i].value)
                const voteContract = "0x5FB0A1Ee26f7dD41f28d2258a2892dc6332F87DF"
                const provider = getProvider()
                const signer = provider.getSigner()
                const contract = new ethers.Contract(voteContract, ["function votar(uint256 _choice)external returns(bool)"], provider)
                if(radios[i].value =='azul'){
                    const contractSigner = contract.connect(signer)
                    const votoAzul = await contractSigner.votar(1)
                    console.log(votoAzul)
                }else if(radios[i].value == 'amarela'){
                    const contractSigner = contract.connect(signer)
                    const votoAmarelo = await contractSigner.votar(2)
                    console.log(votoAmarelo)
                }
            }
        }
    }
}